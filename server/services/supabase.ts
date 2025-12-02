// server/services/supabase.ts
import dotenv from 'dotenv';
// set env vars
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
console.log('Supabase URL:', supabaseUrl ? 'Loaded' : 'Not Loaded');
console.log('Supabase Key:', supabaseKey ? 'Loaded' : 'Not Loaded');
// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);