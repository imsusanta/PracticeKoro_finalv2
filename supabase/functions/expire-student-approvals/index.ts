import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Checking for expired student approvals...');

    // Find all approved students whose approval has expired
    const { data: expiredApprovals, error: fetchError } = await supabaseClient
      .from('approval_status')
      .select('id, user_id, expires_at, profiles!inner(email, full_name)')
      .eq('status', 'approved')
      .not('expires_at', 'is', null)
      .lte('expires_at', new Date().toISOString()) as { 
        data: Array<{
          id: string;
          user_id: string;
          expires_at: string;
          profiles: { email: string; full_name: string | null };
        }> | null;
        error: any;
      };

    if (fetchError) {
      console.error('Error fetching expired approvals:', fetchError);
      throw fetchError;
    }

    if (!expiredApprovals || expiredApprovals.length === 0) {
      console.log('No expired approvals found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No expired approvals found',
          expired_count: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${expiredApprovals.length} expired approvals`);

    // Update expired approvals to deactivated status
    const userIds = expiredApprovals.map(a => a.user_id);
    
    const { error: updateError } = await supabaseClient
      .from('approval_status')
      .update({ status: 'deactivated' })
      .in('user_id', userIds);

    if (updateError) {
      console.error('Error updating expired approvals:', updateError);
      throw updateError;
    }

    // Create notifications for deactivated students
    const notifications = expiredApprovals.map(approval => ({
      user_id: approval.user_id,
      title: 'Account Approval Expired',
      message: 'Your account approval has expired. Please contact support to renew your access.',
      type: 'warning'
    }));

    const { error: notifError } = await supabaseClient
      .from('notifications')
      .insert(notifications);

    if (notifError) {
      console.error('Error creating notifications:', notifError);
      // Don't throw here - expiration is more important than notification
    }

    console.log(`Successfully deactivated ${expiredApprovals.length} expired approvals`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Deactivated ${expiredApprovals.length} expired approvals`,
        expired_count: expiredApprovals.length,
        deactivated_users: expiredApprovals.map(a => ({
          email: a.profiles.email,
          name: a.profiles.full_name,
          expired_at: a.expires_at
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in expire-student-approvals function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})
