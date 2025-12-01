-- Run this in Supabase SQL Editor

-- Existing Tables (Ensure they exist)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) NOT NULL,
  lat FLOAT NOT NULL,
  lng FLOAT NOT NULL,
  heading FLOAT,
  accuracy FLOAT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- OSINT: Fingerprints Table
CREATE TABLE IF NOT EXISTS fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) NOT NULL,
  visitor_id TEXT, -- Unique hash
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

-- OSINT: IP Logs Table
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

-- Add accuracy column if missing (Migration safety)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'accuracy') THEN
        ALTER TABLE locations ADD COLUMN accuracy FLOAT;
    END IF;
END $$;

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE locations;
ALTER PUBLICATION supabase_realtime ADD TABLE fingerprints;
ALTER PUBLICATION supabase_realtime ADD TABLE ip_logs;

-- RLS Policies (Public for demo)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public sessions access" ON sessions FOR ALL USING (true);
CREATE POLICY "Public locations access" ON locations FOR ALL USING (true);
CREATE POLICY "Public fingerprints access" ON fingerprints FOR ALL USING (true);
CREATE POLICY "Public ip_logs access" ON ip_logs FOR ALL USING (true);
