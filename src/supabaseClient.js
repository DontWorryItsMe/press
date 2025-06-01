// supabaseClient.js: Exports a configured Supabase client for database access
import { createClient } from '@supabase/supabase-js';
import { logAudit } from './security/logger';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  logAudit('supabase_client_error', { reason: 'Missing environment variables' });
  throw new Error('Supabase environment variables are not set.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
logAudit('supabase_client_created', { url: SUPABASE_URL });
