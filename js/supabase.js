// js/supabase.js
const SUPABASE_URL = "https://tkqdqydcthdztitfzmrs.supabase.co";
const SUPABASE_ANON_KEY = "SUA_ANON_KEY_AQUI";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
