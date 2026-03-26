let conveniosCache = [];

// LOGOUT
async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}

// INICIAR DASHBOARD
document.addEventListener("DOMContentLoaded", async () => {
  const { data: session } = await supabaseClient.auth.getSession();
  if (!session.session) {
    window.location.href = "index.html";
    return;
  }

  carregarConvenios();
});

// CARREGAR CONVENIOS
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

/* ================= EMPRESA ================= */
const empresaInput = document.getElementById("empresaInput");
const empresaDropdown = document.getElementById("empresaDropdown");

empresaInput.addEventListener("focus", () => renderEmpresas(""));
empresaInput.addEventListener("input", () => {
  const valor = empresaInput.value.trim();
  renderEmpresas(valor);

  if (valor === "") {
    limparTudo();
  }
});

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

  prepararConvenios(empresa);
  limparDadosAbaixoEmpresa();
}

/* ================= CONVENIO ================= */
const convenioInput = document.getElementById("convenioInput");
const convenioDropdown = document.getElementById("convenioDropdown");

function prepararConvenios(empresa) {
  convenioInput.disabled = false;
  convenioInput.value = "";

  convenioInput.addEventListener("focus", () => renderConvenios(empresa, ""));
  convenioInput.addEventListener("input", () => {
    const valor = convenioInput.value.trim();
    renderConvenios(empresa, valor);

    if (valor === "") {
      limparDadosAbaixoConvenio();
    }
  });
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

/* ================= LIMPEZA ================= */
function limparTudo() {
  empresaInput.value = "";
  convenioInput.value = "";
  convenioInput.disabled = true;

  limparDadosAbaixoEmpresa();
}

function limparDadosAbaixoEmpresa() {
  document.getElementById("outEmpresa").textContent = "—";
  limparDadosAbaixoConvenio();
}

function limparDadosAbaixoConvenio() {
  document.getElementById("outConvenio").textContent = "—";
  document.getElementById("outLink").textContent = "—";
  document.getElementById("outLogin").textContent = "—";
  document.getElementById("outSenha").textContent = "—";
  document.getElementById("btnChamado").disabled = true;
}

/* FECHAR MENU AO CLICAR FORA */
document.addEventListener("click", (e) => {
  if (!e.target.closest(".filtro")) {
    empresaDropdown.style.display = "none";
    convenioDropdown.style.display = "none";
  }
});

/* BOTÃO CHAMADO */
document.getElementById("btnChamado").addEventListener("click", () => {
  alert("Solicitação de alteração de senha enviada.");
});
