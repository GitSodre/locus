// js/dashboard.js
async function logout() {
  await supabaseClient.auth.signOut();
  localStorage.clear();
  window.location.href = "index.html";
}

async function carregarConvenios() {
  const { data, error } = await supabaseClient
    .from("convenios")
    .select("*");

  if (error) {
    console.error("Erro ao carregar convênios:", error.message);
    return;
  }

  const container = document.getElementById("lista-convenios");
  container.innerHTML = "";

  const tipoUsuario = localStorage.getItem("tipoUsuario");

  data.forEach(c => {
    const div = document.createElement("div");
    div.classList.add("convenio-card");

    div.innerHTML = `
      <h3>${c.convenio}</h3>
      <p><strong>Empresa:</strong> ${c.empresa}</p>
      <p><strong>Link:</strong> ${c.link}</p>
      <p><strong>Login:</strong> ${c.login}</p>
      ${
        tipoUsuario === "admin"
          ? `<p><strong>Senha:</strong> ${c.senha}</p>`
          : `<p><em>Senha restrita</em></p>`
      }
      <hr>
    `;

    container.appendChild(div);
  });
}

supabaseClient.auth.getSession().then(({ data: { session } }) => {
  if (!session) {
    window.location.href = "index.html";
  } else {
    carregarConvenios();
  }
});
