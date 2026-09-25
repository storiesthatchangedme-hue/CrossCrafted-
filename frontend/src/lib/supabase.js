import { createClient } from '@supabase/supabase-js'

// Supabase credentials - use env vars if available, otherwise fallback to hardcoded values
// This ensures the app works on Vercel even if env vars aren't configured in the dashboard
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://duqmrwudpdmrbruwaark.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1cW1yd3VkcGRtcmJydXdhYXJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMTM1MTYsImV4cCI6MjA5OTU4OTUxNn0.AaHfWyWdb9imU24VT5bi2wWl_L4GO4yqD2g6OA7JUZk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
