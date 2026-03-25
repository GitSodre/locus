// js/supabase.js
const SUPABASE_URL = "https://tkqdqydcthdztitfzmrs.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_i4isIUlDwBdLYQBcmEDijw_lFJmKhNG";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
