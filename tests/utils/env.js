import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
const envPath = path.resolve(__dirname, '../../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) {
    process.env[k] = envConfig[k];
}

export const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
export const BASE_URL = 'http://localhost:3000';

// Shared Test Data Context
export const TEST_DATA = {
    artist_id: '11111111-1111-1111-1111-111111111111',
    client_id: '3acb7a63-64b8-461c-b3ef-4633274e2d84',
    service_id: '54deacd3-12c5-4e5c-9c5f-0918bcbc8652',
    project_id: '66666666-6666-6666-6666-666666666666',
    bookingId: null // Valid after booking test
};

export async function fetchJson(url, opts = {}) {
    if (opts.body && typeof opts.body === 'object' && !(opts.body instanceof FormData)) {
        opts.body = JSON.stringify(opts.body);
        opts.headers = { ...opts.headers, 'Content-Type': 'application/json' };
    }
    const res = await fetch(url, opts);
    if (res.status >= 400) {
        const text = await res.text();
        console.error(`  [API ERROR] ${res.status}: ${text}`);
    }
    return res;
}
