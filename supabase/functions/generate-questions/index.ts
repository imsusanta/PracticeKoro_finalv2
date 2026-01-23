import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { subject, topic, count, language, customText, systemPrompt } = await req.json()

        // Create Supabase client with Service Role Key to bypass RLS and read settings
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Fetch OpenRouter settings from site_settings table
        const { data: settingsData, error: settingsError } = await supabaseClient
            .from('site_settings')
            .select('key, value')
            .in('key', ['openrouter_api_key', 'openrouter_model']);

        if (settingsError) throw settingsError;

        const openRouterApiKey = settingsData?.find(s => s.key === 'openrouter_api_key')?.value;
        const openRouterModel = settingsData?.find(s => s.key === 'openrouter_model')?.value || 'meta-llama/llama-3.1-405b-instruct:free';

        // If API key is not in DB, try env var as fallback
        const finalApiKey = openRouterApiKey || Deno.env.get('OPENROUTER_API_KEY');

        if (!finalApiKey) {
            throw new Error('OpenRouter API key not configured. Please set it in Admin Settings.');
        }

        const defaultSystemPrompt = `You are an expert question generator for competitive exams. 
    Generate ${count} MCQ questions based on the provided ${subject ? 'subject: ' + subject : ''} ${topic ? 'and topic: ' + topic : ''}.
    ${customText ? '\n\nSource Content for generation:\n' + customText : ''}
    
    Format the output as a MINIFIED JSON object with a "questions" array.
    Each question must have:
    - question_text (string)
    - option_a (string)
    - option_b (string)
    - option_c (string)
    - option_d (string)
    - correct_answer (string, one of: "A", "B", "C", "D")
    - explanation (string) - Detailed "Short Notes" explaining the concept and why the answer is correct.

    Language: ${language || 'English'}
    
    Ensure the questions are accurate, challenging, and follow standard exam patterns. 
    The "explanation" field must contain helpful "Short Notes" for the student.`;

        const finalSystemPrompt = systemPrompt || defaultSystemPrompt;

        console.log(`Generating ${count} questions using model: ${openRouterModel}`);

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${finalApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "model": openRouterModel,
                "messages": [
                    { "role": "system", "content": finalSystemPrompt },
                    { "role": "user", "content": `Generate ${count} MCQ questions in ${language || 'English'} based on the instructions.` }
                ],
                "response_format": { "type": "json_object" }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
        }

        const aiData = await response.json();
        const content = aiData.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error('No content received from AI model');
        }

        try {
            const parsedContent = JSON.parse(content);
            return new Response(JSON.stringify(parsedContent), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        } catch (parseError) {
            console.error("Failed to parse AI response:", content);
            throw new Error("AI returned invalid JSON format. Please try again.");
        }

    } catch (error) {
        console.error("Edge Function Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
