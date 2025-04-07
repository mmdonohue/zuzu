// server/services/supabase.ts
import dotenv from 'dotenv';
// set env vars
dotenv.config();
import { createClient } from '@supabase/supabase-js';
// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);
