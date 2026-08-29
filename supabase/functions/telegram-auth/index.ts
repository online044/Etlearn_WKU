// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function verifyTelegramInitData(initData: string, botToken: string): Promise<{ valid: boolean; user?: any }> {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return { valid: false };

    params.delete('hash');
    const items: string[] = [];
    const entries = Array.from(params.entries());
    entries.sort((a, b) => a[0].localeCompare(b[0]));

    for (const [key, value] of entries) {
      items.push(`${key}=${value}`);
    }
    const dataCheckString = items.join('\n');

    const encoder = new TextEncoder();
    const webAppDataKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode('WebAppData'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const secretKeyBuffer = await crypto.subtle.sign('HMAC', webAppDataKey, encoder.encode(botToken));

    const secretKey = await crypto.subtle.importKey(
      'raw',
      secretKeyBuffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const calculatedBuffer = await crypto.subtle.sign('HMAC', secretKey, encoder.encode(dataCheckString));
    const calculatedHashArr = Array.from(new Uint8Array(calculatedBuffer));
    const calculatedHash = calculatedHashArr.map(b => b.toString(16).padStart(2, '0')).join('');

    const valid = calculatedHash.toLowerCase() === hash.toLowerCase();

    let user = null;
    const userStr = params.get('user');
    if (userStr) {
      try {
        user = JSON.parse(userStr);
      } catch (e) {
        user = null;
      }
    }

    return { valid, user };
  } catch (err) {
    console.error('Error verifying initData:', err);
    return { valid: false };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { initData } = await req.json();

    if (!initData) {
      return new Response(
        JSON.stringify({ error: 'Missing initData in request payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      return new Response(
        JSON.stringify({ error: 'TELEGRAM_BOT_TOKEN environment variable is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { valid, user } = await verifyTelegramInitData(initData, botToken);

    if (!valid || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or forged Telegram initData signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';

    let profile = null;
    let isNew = false;

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Query student_profiles table by telegram_id
      const { data: existing } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('telegram_id', user.id.toString())
        .maybeSingle();

      if (existing) {
        const { data: updated } = await supabase
          .from('student_profiles')
          .update({
            username: user.username || existing.username,
            name: `${user.first_name} ${user.last_name || ''}`.trim(),
            photo_url: user.photo_url || existing.photo_url,
            updated_at: new Date().toISOString()
          })
          .eq('telegram_id', user.id.toString())
          .select()
          .single();

        profile = updated || existing;
        isNew = false;
      } else {
        const newProfile = {
          telegram_id: user.id.toString(),
          name: `${user.first_name} ${user.last_name || ''}`.trim(),
          username: user.username || '',
          photo_url: user.photo_url || '',
          email: `${user.username || user.id}@telegram.ethiolearn.et`,
          university: 'Wolkite University',
          year: '2nd Year',
          is_pro: false,
          created_at: new Date().toISOString()
        };

        const { data: inserted, error: insertErr } = await supabase
          .from('student_profiles')
          .insert(newProfile)
          .select()
          .single();

        if (insertErr) {
          console.warn('Supabase insert warning, fallback to local object:', insertErr);
          profile = newProfile;
        } else {
          profile = inserted;
        }
        isNew = true;
      }
    } else {
      // Fallback if Supabase credentials are not provided in environment
      profile = {
        telegram_id: user.id.toString(),
        name: `${user.first_name} ${user.last_name || ''}`.trim(),
        username: user.username || '',
        photo_url: user.photo_url || '',
        email: `${user.username || user.id}@telegram.ethiolearn.et`,
        university: 'Wolkite University',
        year: '2nd Year',
        is_pro: false,
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        verified: true,
        telegramUser: user,
        profile,
        isNew
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
