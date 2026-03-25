const SUPABASE_URL = "https://tkqdqydcthdztitfzmrs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "SUA_SB_PUBLISHABLE_KEY_AQUI";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
