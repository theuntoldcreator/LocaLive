import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
    try {
        const { sessionId } = await request.json();

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
        }

        // Get IP from headers
        const forwardedFor = request.headers.get('x-forwarded-for');
        const ip = forwardedFor ? forwardedFor.split(',')[0] : 'Unknown';

        // Fetch IP details from ip-api.com
        let ipDetails = {};

        // Handle Localhost
        if (ip === '::1' || ip === '127.0.0.1' || ip === 'Unknown') {
            ipDetails = {
                isp: 'Localhost System',
                country: 'Local Environment',
                city: 'Dev Machine',
                region: 'Local',
                is_proxy: false,
                is_vpn: false
            };
        } else {
            try {
                const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,isp,as,mobile,proxy,hosting`);
                const data = await res.json();
                if (data.status === 'success') {
                    ipDetails = {
                        isp: data.isp,
                        asn: data.as,
                        country: data.country,
                        city: data.city,
                        region: data.regionName,
                        is_proxy: data.proxy || data.hosting,
                        is_vpn: data.hosting, // Heuristic
                    };
                }
            } catch (e) {
                console.error('IP lookup failed', e);
            }
        }

        // Insert into ip_logs
        const { error } = await supabase
            .from('ip_logs')
            .insert([{
                session_id: sessionId,
                ip_address: ip,
                ...ipDetails
            }]);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Log visit error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
