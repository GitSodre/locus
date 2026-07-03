const SUPABASE_URL = "https://tkqdqydcthdztitfzmrs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_i4isIUlDwBdLYQBcmEDijw_lFJmKhNG";

/*
 * Por padrão o Supabase guarda a sessão no localStorage, que sobrevive
 * mesmo depois de fechar e reabrir o navegador — por isso um favorito
 * apontando pro dashboard.html caía direto sem pedir login de novo.
 *
 * Usando sessionStorage, a sessão só dura enquanto a aba/janela do
 * navegador estiver aberta. Ao fechar tudo e abrir de novo (inclusive
 * pelos favoritos), o login será exigido novamente.
 */
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: window.sessionStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
