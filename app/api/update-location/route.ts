import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const locationSchema = z.object({
    sessionId: z.string().uuid(),
    lat: z.number(),
    lng: z.number(),
    heading: z.number().nullable(),
    accuracy: z.number(),
    fingerprint: z.any().optional(), // Allow fingerprint data
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validation = locationSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues }, { status: 400 });
        }

        const { sessionId, lat, lng, heading, accuracy, fingerprint } = validation.data;

        // 1. Insert Location
        const { error: locationError } = await supabase
            .from('locations')
            .insert([{ session_id: sessionId, lat, lng, heading, accuracy }]);

        if (locationError) throw locationError;

        // 2. Handle Intelligence (Fingerprint + IP) - Only if fingerprint is provided (first connect)
        if (fingerprint) {
            // Get IP from headers
            const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

            // Enrich IP Data (Server-side)
            let ipData = {};

            // Handle Localhost
            if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
                ipData = {
                    isp: 'Local Development Network',
                    as: 'AS0000 Localhost',
                    country: 'Local Environment',
                    countryCode: 'LOC',
                    regionName: 'Dev Region',
                    city: 'Local Machine',
                    timezone: 'UTC'
                };
            } else {
                try {
                    const ipRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`);
                    ipData = await ipRes.json();
                } catch (e) {
                    console.error('IP Lookup failed', e);
                }
            }

            // Insert Fingerprint
            const { error: fpError } = await supabase
                .from('fingerprints')
                .insert([{
                    session_id: sessionId,
                    visitor_id: fingerprint.visitorId,
                    device_model: fingerprint.deviceModel,
                    os_name: fingerprint.osName,
                    os_version: fingerprint.osVersion,
                    browser_name: fingerprint.browserName,
                    browser_version: fingerprint.browserVersion,
                    screen_resolution: fingerprint.screenResolution,
                    gpu_renderer: fingerprint.gpuRenderer,
                    cpu_cores: fingerprint.cpuCores,
                    ram_gb: fingerprint.ramGb,
                    timezone: fingerprint.timezone,
                    language: fingerprint.language,
                    user_agent: fingerprint.userAgent
                }]);

            if (fpError) console.error('Fingerprint insert error', fpError);

            // Insert IP Log
            const { error: ipError } = await supabase
                .from('ip_logs')
                .insert([{
                    session_id: sessionId,
                    ip_address: ip,
                    isp: (ipData as any).isp || 'Unknown',
                    asn: (ipData as any).as || 'Unknown',
                    country: (ipData as any).country || 'Unknown',
                    city: (ipData as any).city || 'Unknown',
                    region: (ipData as any).regionName || 'Unknown',
                    is_proxy: false, // Placeholder for real detection
                    is_vpn: false,
                    is_tor: false,
                    risk_score: 0
                }]);

            if (ipError) console.error('IP Log insert error', ipError);
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Update location error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
