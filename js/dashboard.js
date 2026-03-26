let conveniosCache = [];

// Logout
async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}

// Inicialização
document.addEventListener("DOMContentLoaded", async () => {
  const { data: session } = await supabaseClient.auth.getSession();
  if (!session.session) {
    window.location.href = "index.html";
    return;
  }

  carregarConvenios();
});

// Carregar dados
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

// EMPRESA
const empresaInput = document.getElementById("empresaInput");
const empresaDropdown = document.getElementById("empresaDropdown");

empresaInput.addEventListener("focus", () => renderEmpresas(""));
empresaInput.addEventListener("input", () => renderEmpresas(empresaInput.value));

function renderEmpresas(filtro) {
  empresaDropdown.innerHTML = "";

  const empresas = [...new Set(conveniosCache.map(c => c.empresa))]
    .filter(e => e.toLowerCase().includes(filtro.toLowerCase()));

  empresas.forEach(e => {
    const div = document.createElement("div");
    div.textContent = e;
    div.onclick = () => selecionarEmpresa(e);
    empresaDropdown.appendChild(div);
  });

  empresaDropdown.style.display = empresas.length ? "block" : "none";
}

function selecionarEmpresa(empresa) {
  empresaInput.value = empresa;
  empresaDropdown.style.display = "none";

  document.getElementById("outEmpresa").textContent = empresa;
  limparDados();

  prepararConvenios(empresa);
}

// CONVÊNIO
const convenioInput = document.getElementById("convenioInput");
const convenioDropdown = document.getElementById("convenioDropdown");

function prepararConvenios(empresa) {
  convenioInput.disabled = false;
  convenioInput.value = "";

  convenioInput.addEventListener("focus", () => renderConvenios(empresa, ""));
  convenioInput.addEventListener("input", () => renderConvenios(empresa, convenioInput.value));
}

function renderConvenios(empresa, filtro) {
  convenioDropdown.innerHTML = "";

  conveniosCache
    .filter(c =>
      c.empresa === empresa &&
      c.convenio.toLowerCase().includes(filtro.toLowerCase())
    )
    .forEach(c => {
      const div = document.createElement("div");
      div.textContent = c.convenio;
      div.onclick = () => selecionarConvenio(c);
      convenioDropdown.appendChild(div);
    });

  convenioDropdown.style.display = "block";
}

function selecionarConvenio(c) {
  convenioInput.value = c.convenio;
  convenioDropdown.style.display = "none";

  document.getElementById("outConvenio").textContent = c.convenio;
  document.getElementById("outLink").textContent = c.link || "—";
  document.getElementById("outLogin").textContent = c.login || "—";
  document.getElementById("outSenha").textContent = c.senha || "—";

  document.getElementById("btnChamado").disabled = false;
}

// Fechar dropdown ao clicar fora
document.addEventListener("click", (e) => {
  if (!e.target.closest(".filtro")) {
    empresaDropdown.style.display = "none";
    convenioDropdown.style.display = "none";
  }
});

// Limpar dados
function limparDados() {
  document.getElementById("outConvenio").textContent = "—";
  document.getElementById("outLink").textContent = "—";
  document.getElementById("outLogin").textContent = "—";
  document.getElementById("outSenha").textContent = "—";
  document.getElementById("btnChamado").disabled = true;
}

// Botão chamado
document.getElementById("btnChamado").addEventListener("click", () => {
  alert("Solicitação de alteração de senha enviada.");
});
