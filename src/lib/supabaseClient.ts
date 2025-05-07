// src/lib/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error("Supabase URL is not defined. Please check your .env.local file and ensure NEXT_PUBLIC_SUPABASE_URL is set.");
  // In a client-side context, throwing an error might break the app.
  // Consider how to handle this gracefully, e.g., by disabling Supabase-dependent features.
  // For now, we'll proceed, but Supabase calls will fail.
}

if (!supabaseAnonKey) {
  console.error("Supabase anon key is not defined. Please check your .env.local file and ensure NEXT_PUBLIC_SUPABASE_ANON_KEY is set.");
  // Similar handling as above.
}

// Create a single Supabase client instance.
// It's important to handle the case where URL or key might be missing, 
// though createClient itself will throw if they are undefined.
// The checks above provide more specific error messages.
const supabase: SupabaseClient = createClient(supabaseUrl!, supabaseAnonKey!); 
// The non-null assertion operator (!) is used here because we've already checked 
// and logged errors if they are undefined. If they are indeed undefined at this point,
// createClient will throw its own error, which is acceptable.

export { supabase };