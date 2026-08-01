// ============================================================
// SUPABASE DATABASE CONFIGURATION & CLIENT INITIALIZATION
// Annamalai University College Attendance Management System
// ============================================================

(function (window) {
  // 1. SUPABASE PROJECT CREDENTIALS
  // Replace the placeholder values below with your actual project credentials from https://supabase.com
  const SUPABASE_URL = "https://your-project-id.supabase.co";
  const SUPABASE_ANON_KEY = "your-anon-public-api-key-here";

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
