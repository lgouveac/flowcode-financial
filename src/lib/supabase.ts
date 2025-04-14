
import { createClient } from '@supabase/supabase-js';

// Use hardcoded values instead of environment variables since they're available in the project
const supabaseUrl = "https://itlpvpdwgiwbdpqheemw.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0bHB2cGR3Z2l3YmRwcWhlZW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxOTA5NzEsImV4cCI6MjA1NTc2Njk3MX0.gljQ6JAfbMzP-cbA68Iz21vua9YqAqVQgpB-eLk6nAg";

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);
