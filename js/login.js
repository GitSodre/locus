// Mostrar / ocultar senha
document.getElementById("toggleSenha").addEventListener("click", () => {
  const senha = document.getElementById("senha");
  senha.type = senha.type === "password" ? "text" : "password";
});

// Enter faz login
document.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    document.getElementById("btnEntrar").click();
  }
});

document.getElementById("btnEntrar").addEventListener("click", async () => {
  const email = document.getElementById("login").value.trim();
  const senha = document.getElementById("senha").value.trim();

  if (!email || !senha) {
    alert("Preencha email e senha");
    return;
  }

  const { data: loginData, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password: senha
  });

  if (error) {
    alert("Login inválido");
    return;
  }

  // Verifica se este é o primeiro acesso do usuário: se for, ele ainda
  // está usando a senha temporária cadastrada pelo admin e precisa
  // definir sua própria senha (PIN de 6 dígitos) antes de entrar.
  //
  // A consulta usa o email devolvido pela sessão (já normalizado pelo
  // Supabase), e não o que foi digitado — assim uma diferença de
  // maiúsculas/minúsculas não faz a checagem passar batido.
  const emailSessao = loginData.user?.email || email;

  const { data: userRow, error: errUsuario } = await supabaseClient
    .from("usuarios")
    .select("primeiro_acesso")
    .eq("email", emailSessao)
    .maybeSingle();

  if (errUsuario) {
    console.error("Erro ao verificar primeiro acesso:", errUsuario);
  }

  if (userRow?.primeiro_acesso) {
    window.location.href = "primeiro-acesso.html";
    return;
  }

  window.location.href = "dashboard.html";
});
