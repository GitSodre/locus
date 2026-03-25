// js/dashboard.js

// Função de logout
async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}

// Função principal do dashboard
async function carregarDashboard() {
  // 1️⃣ Verificar sessão
  const { data: sessionData, error: sessionError } =
    await supabaseClient.auth.getSession();

  if (sessionError || !sessionData.session) {
    window.location.href = "index.html";
    return;
  }

  const email = sessionData.session.user.email;

  // 2️⃣ Buscar perfil do usuário na tabela usuarios
  const { data: usuario, error: usuarioError } = await supabaseClient
    .from("usuarios")
    .select("tipo")
    .eq("email", email)
    .single();

  // 3️⃣ Se não tiver permissão, bloquear acesso
  if (usuarioError || !usuario) {
    alert("Usuário sem permissão");
    await supabaseClient.auth.signOut();
    window.location.href = "index.html";
    return;
  }

  // 4️⃣ Buscar convênios
  const { data: convenios, error: conveniosError } =
    await supabaseClient
      .from("convenios")
      .select("*");

  if (conveniosError) {
    console.error("Erro ao carregar convênios:", conveniosError);
    return;
  }

  // 5️⃣ Exibir convênios
  const container = document.getElementById("lista-convenios");
  container.innerHTML = "";

  convenios.forEach(c => {
    const div = document.createElement("div");
    div.classList.add("convenio-card");

    div.innerHTML = `
      <h3>${c.convenio}</h3>
      <p><strong>Empresa:</strong> ${c.empresa}</p>
      <p><strong>Login:</strong> ${c.login}</p>
      ${
        usuario.tipo === "admin"
          ? `<p><strong>Senha:</strong> ${c.senha}</p>`
          : `<p><em>Senha restrita</em></p>`
      }
      <hr>
    `;

    container.appendChild(div);
  });
}

// Executar ao carregar a página
carregarDashboard();
