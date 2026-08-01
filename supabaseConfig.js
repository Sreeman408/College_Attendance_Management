// ============================================================
// SUPABASE DATABASE CONFIGURATION & CLIENT INITIALIZATION
// Annamalai University College Attendance Management System
// ============================================================

(function (window) {
  // 1. SUPABASE PROJECT CREDENTIALS
  // Replace the placeholder values below with your actual project credentials from https://supabase.com
  const SUPABASE_URL = "https://tysutoqyagpawuklpaxj.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5c3V0b3F5YWdwYXd1a2xwYXhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NTU3MTIsImV4cCI6MjEwMTEzMTcxMn0.CZYjC7wiUaM9CBHrp9qKxw4ZQ8SYe8n1tISlS7XxbJI";

  // Helper check to determine if credentials have been replaced with valid project values
  function isConfigured() {
    return (
      typeof SUPABASE_URL === 'string' &&
      SUPABASE_URL.startsWith('https://') &&
      !SUPABASE_URL.includes('your-project-id') &&
      typeof SUPABASE_ANON_KEY === 'string' &&
      SUPABASE_ANON_KEY.length > 20 &&
      !SUPABASE_ANON_KEY.includes('your-anon-public-api-key')
    );
  }

  let supabaseClient = null;

  if (isConfigured() && window.supabase && typeof window.supabase.createClient === 'function') {
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log('✅ Connected to Supabase Cloud Database successfully!');
    } catch (e) {
      console.warn('⚠️ Supabase client initialization failed:', e);
    }
  } else {
    console.log('ℹ️ Running in Local Demo Mode (Supabase credentials not yet configured).');
  }

  // Export configuration state and client to global window scope
  window.SupabaseConfig = {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    isConfigured: isConfigured,
    getClient: () => supabaseClient
  };

})(window);
