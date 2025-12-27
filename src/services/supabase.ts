import { createClient } from '@supabase/supabase-js';
// set env vars
// console.log('process.env.REACT_APP_SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL ? 'Loaded' : 'Not Loaded');
// console.log('process.env.REACT_APP_SUPABASE_KEY:', process.env.REACT_APP_SUPABASE_KEY ? 'Loaded' : 'Not Loaded');
// Initialize Supabase client (replace these with your actual Supabase credentials)
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "";
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY || "";

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Example functions for interacting with Supabase

// Fetch data from a table
export const fetchData = async <T>(
  tableName: string,
  options?: {
    columns?: string;
    filters?: Record<string, any>;
    limit?: number;
    orderBy?: { column: string; ascending?: boolean };
  }
) => {
  let query = supabase.from(tableName).select(options?.columns || '*');

  // Apply filters if provided
  if (options?.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  // Apply ordering if provided
  if (options?.orderBy) {
    query = query.order(options.orderBy.column, {
      ascending: options.orderBy.ascending ?? true,
    });
  }

  // Apply limit if provided
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error(`Error fetching data from ${tableName}:`, error);
    throw error;
  }

  return data as T[];
};

// Insert data into a table
export const insertData = async <T>(
  tableName: string,
  data: Partial<T> | Partial<T>[]
) => {
  const { data: result, error } = await supabase.from(tableName).insert(data).select();

  if (error) {
   // console.error(`Error inserting data into ${tableName}:`, error);
    throw error;
  }

  return result;
};

// Update data in a table
export const updateData = async <T>(
  tableName: string,
  id: number | string,
  data: Partial<T>
) => {
  const { data: result, error } = await supabase
    .from(tableName)
    .update(data)
    .eq('id', id)
    .select();

  if (error) {
    // console.error(`Error updating data in ${tableName}:`, error);
    throw error;
  }

  return result;
};

// Delete data from a table
export const deleteData = async (tableName: string, id: number | string) => {
  const { error } = await supabase.from(tableName).delete().eq('id', id);

  if (error) {
    // console.error(`Error deleting data from ${tableName}:`, error);
    throw error;
  }

  return true;
};