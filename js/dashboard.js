let conveniosCache = [];

// Logout
async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}

// Inicialização
async function iniciarDashboard() {
  const { data: sessionData } = await supabaseClient.auth.getSession();
  if (!sessionData.session) {
    window.location.href = "index.html";
    return;
  }
  carregarConvenios();
}

// Carregar convênios do banco
async function carregarConvenios() {
  const { data, error } = await supabaseClient
    .from("convenios")
    .select("*");

  if (error) {
    console.error(error);
    return;
  }

  conveniosCache = data;
}

// AUTOCOMPLETE EMPRESA
const empresaInput = document.getElementById("empresaInput");
const empresaDropdown = document.getElementById("empresaDropdown");

empresaInput.addEventListener("input", () => {
  const valor = empresaInput.value.toLowerCase();
  empresaDropdown.innerHTML = "";

  const empresas = [...new Set(conveniosCache.map(c => c.empresa))]
    .filter(e => e.toLowerCase().includes(valor));

  empresas.forEach(e => {
    const div = document.createElement("div");
    div.textContent = e;
    div.onclick = () => {
      empresaInput.value = e;
      empresaDropdown.style.display = "none";
      prepararConvenios(e);
      limparDados();
      document.getElementById("outEmpresa").textContent = e;
    };
    empresaDropdown.appendChild(div);
  });

  empresaDropdown.style.display = empresas.length ? "block" : "none";
});

// AUTOCOMPLETE CONVÊNIO
function prepararConvenios(empresa) {
  const convenioInput = document.getElementById("convenioInput");
  const convenioDropdown = document.getElementById("convenioDropdown");

  convenioInput.disabled = false;
  convenioInput.value = "";
  convenioDropdown.innerHTML = "";

  convenioInput.oninput = () => {
    const valor = convenioInput.value.toLowerCase();
    convenioDropdown.innerHTML = "";

    conveniosCache
      .filter(c =>
        c.empresa === empresa &&
        c.convenio.toLowerCase().includes(valor)
      )
      .forEach(c => {
        const div = document.createElement("div");
        div.textContent = c.convenio;
        div.onclick = () => {
          convenioInput.value = c.convenio;
          convenioDropdown.style.display = "none";
          preencherDados(c);
        };
        convenioDropdown.appendChild(div);
      });

    convenioDropdown.style.display = "block";
  };
}

// Preencher dados
function preencherDados(c) {
  document.getElementById("outEmpresa").textContent = c.empresa;
  document.getElementById("outConvenio").textContent = c.convenio;
  document.getElementById("outLink").textContent = c.link || "—";
  document.getElementById("outLogin").textContent = c.login || "—";
  document.getElementById("outSenha").textContent = c.senha || "—";
  document.getElementById("btnChamado").disabled = false;
}

// Limpar dados
function limparDados() {
  document.getElementById("outConvenio").textContent = "—";
  document.getElementById("outLink").textContent = "—";
  document.getElementById("outLogin").textContent = "—";
  document.getElementById("outSenha").textContent = "—";
  document.getElementById("btnChamado").disabled = true;
}

// Botão de chamado
document.getElementById("btnChamado").addEventListener("click", () => {
  alert("Solicitação de alteração de senha enviada.");
  // Próximo passo: INSERT na tabela chamados
});

// Iniciar
iniciarDashboard();
