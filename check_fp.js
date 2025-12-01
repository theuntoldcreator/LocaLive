
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkFingerprints() {
    console.log('Checking fingerprints...');

    const { data: sessions } = await supabase.from('sessions').select('id').eq('active', true);
    if (!sessions || sessions.length === 0) {
        console.log('No active session.');
        return;
    }

    const sessionId = sessions[0].id;
    console.log('Active Session:', sessionId);

    const { data: fps, error } = await supabase
        .from('fingerprints')
        .select('*')
        .eq('session_id', sessionId);

    if (error) console.error('Error:', error);
    else {
        console.log(`Found ${fps.length} fingerprints.`);
        if (fps.length > 1) console.log('DUPLICATE FINGERPRINTS DETECTED!');
    }
}

checkFingerprints();
