const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkTables() {
    console.log('Checking tables...');

    const { error: ipError } = await supabase.from('ip_logs').select('count').limit(1);
    if (ipError) console.error('Error accessing ip_logs:', ipError.message);
    else console.log('ip_logs table exists.');

    const { error: fpError } = await supabase.from('fingerprints').select('count').limit(1);
    if (fpError) console.error('Error accessing fingerprints:', fpError.message);
    else console.log('fingerprints table exists.');
}

checkTables();
