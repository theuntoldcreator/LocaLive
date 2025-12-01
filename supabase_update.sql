-- Run this in Supabase SQL Editor to fix the missing tables

-- 1. Create Fingerprints Table
CREATE TABLE IF NOT EXISTS fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) NOT NULL,
  visitor_id TEXT,
  device_model TEXT,
  os_name TEXT,
  os_version TEXT,
  browser_name TEXT,
  browser_version TEXT,
  screen_resolution TEXT,
  gpu_renderer TEXT,
  cpu_cores INT,
  ram_gb INT,
  timezone TEXT,
  language TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create IP Logs Table
CREATE TABLE IF NOT EXISTS ip_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) NOT NULL,
  ip_address TEXT NOT NULL,
  isp TEXT,
  asn TEXT,
  country TEXT,
  city TEXT,
  region TEXT,
  is_proxy BOOLEAN DEFAULT false,
  is_vpn BOOLEAN DEFAULT false,
  is_tor BOOLEAN DEFAULT false,
  risk_score INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_logs ENABLE ROW LEVEL SECURITY;

-- 4. Add Policies (Idempotent-ish: will fail if exists, but usually safe to ignore in UI or wrap)
-- We use DO blocks to avoid errors if policies exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public fingerprints access') THEN
        CREATE POLICY "Public fingerprints access" ON fingerprints FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public ip_logs access') THEN
        CREATE POLICY "Public ip_logs access" ON ip_logs FOR ALL USING (true);
    END IF;
END $$;

-- 5. Add to Realtime (Skipping 'locations' to avoid error)
-- We try to add them. If they are already added, this might error, but 'locations' was the blocker.
ALTER PUBLICATION supabase_realtime ADD TABLE fingerprints;
ALTER PUBLICATION supabase_realtime ADD TABLE ip_logs;
