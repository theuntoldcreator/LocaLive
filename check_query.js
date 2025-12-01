
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkQuery() {
    console.log('Checking query...');

    const { data: sessions } = await supabase.from('sessions').select('id').eq('active', true);
    if (!sessions || sessions.length === 0) return;
    const sessionId = sessions[0].id;

    const { data, error } = await supabase
        .from('fingerprints')
        .select(`*, ip_logs(*)`)
        .eq('session_id', sessionId)
        .single();

    if (error) {
        console.error('Query Failed:', error.message);
    } else {
        console.log('Query Success:', data);
    }
}

checkQuery();
