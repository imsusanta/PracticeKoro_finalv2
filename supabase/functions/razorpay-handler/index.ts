import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function verifySignature(orderId: string, paymentId: string, signature: string, secret: string) {
    const text = `${orderId}|${paymentId}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(text));
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const expectedSignature = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return expectedSignature === signature;
}

const handler = async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { action, ...payload } = await req.json();
        const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
        const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");

        if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
            throw new Error("Razorpay keys not configured in Supabase secrets. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
        }

        if (action === "create-order") {
            const { amount, receipt } = payload;
            const response = await fetch("https://api.razorpay.com/v1/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`,
                },
                body: JSON.stringify({
                    amount: Math.round(amount * 100),
                    currency: "INR",
                    receipt,
                }),
            });

            const order = await response.json();
            if (response.status !== 200) throw new Error(order.error?.description || "Failed to create order");

            return new Response(JSON.stringify(order), {
                headers: { "Content-Type": "application/json", ...corsHeaders },
            });
        }

        if (action === "verify-payment") {
            const {
                razorpay_payment_id,
                razorpay_order_id,
                razorpay_signature,
                content_id,
                content_type,
                amount,
            } = payload;

            const isValid = await verifySignature(
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
                RAZORPAY_KEY_SECRET
            );

            if (!isValid) {
                throw new Error("Invalid payment signature");
            }

            const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
            const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
            const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

            const authHeader = req.headers.get("Authorization")!;
            const token = authHeader.replace("Bearer ", "");
            const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

            if (authError || !user) throw new Error("Unauthorized");

            const { error: dbError } = await supabaseAdmin.from("purchases").insert({
                user_id: user.id,
                content_type,
                content_id,
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
                amount,
                status: "completed",
            });

            if (dbError) throw dbError;

            return new Response(JSON.stringify({ success: true }), {
                headers: { "Content-Type": "application/json", ...corsHeaders },
            });
        }

        throw new Error("Invalid action");
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    }
};

serve(handler);
