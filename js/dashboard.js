async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}

async function carregarDashboard() {
  const { data: sessionData } = await supabaseClient.auth.getSession();

  if (!sessionData.session) {
    window.location.href = "index.html";
    return;
  }

  const email = sessionData.session.user.email;

  // ✅ AQUI SIM consultamos a tabela usuarios
  const { data: usuario, error } = await supabaseClient
    .from("usuarios")
    .select("tipo")
    .eq("email", email)
    .single();

  if (error) {
    alert("Usuário sem permissão");
    return;
  }

  const { data: convenios } = await supabaseClient
    .from("convenios")
    .select("*");

  const container = document.getElementById("lista-convenios");
  container.innerHTML = "";

  convenios.forEach(c => {
    container.innerHTML += `
      <div>
        <strong>${c.convenio}</strong><br>
        Empresa: ${c.empresa}<br>
        Login: ${c.login}<br>
        ${
          usuario.tipo === "admin"
            ? `Senha: ${c.senha}`
            : `<em>Senha restrita</em>`
        }
        <hr>
      </div>
    `;
  });
}

carregarDashboard();
``
