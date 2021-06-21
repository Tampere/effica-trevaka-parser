-- Add extensions here as needed (for UUIDs at least)
CREATE SCHEMA IF NOT EXISTS ext;
CREATE SCHEMA IF NOT EXISTS migration;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA ext;