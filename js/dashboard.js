/*********************************
 * DASHBOARD.JS – FINAL E ESTÁVEL
 *********************************/

// Expor logout no escopo global (HTML consegue chamar)
window.logout = async function () {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
};

let conveniosCache = [];

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", async () => {
  const { data: sessionData, error: sessionError } =
    await supabaseClient.auth.getSession();

  if (sessionError || !sessionData.session) {
    window.location.href = "index.html";
    return;
  }

  // Garante que o estado visual inicial esteja desativado
  limparDados();

  const { data, error } = await supabaseClient
    .from("convenios")
    .select("*");

  if (error) {
    console.error("Erro ao carregar convênios:", error);
    alert("Não foi possível carregar os convênios.");
    await window.logout();
    return;
  }

  conveniosCache = data || [];
  carregarEmpresas();
});

/* ================= EMPRESAS ================= */
function carregarEmpresas() {
  const selectEmpresa = document.getElementById("selectEmpresa");
  // limpar mantendo "Selecione"
  selectEmpresa.length = 1;

  const empresas = [...new Set(conveniosCache.map(c => c.empresa))]
    .sort((a, b) => a.localeCompare(b, "pt-BR"));

  empresas.forEach(emp => {
    const opt = document.createElement("option");
    opt.value = emp;
    opt.textContent = emp;
    selectEmpresa.appendChild(opt);
  });

  selectEmpresa.onchange = () => {
    limparDados();
    const empresa = selectEmpresa.value;
    document.getElementById("outEmpresa").textContent = empresa || "—";
    carregarConvenios(empresa);
  };
}

/* ================= CONVÊNIOS ================= */
function carregarConvenios(empresa) {
  const selectConvenio = document.getElementById("selectConvenio");
  selectConvenio.innerHTML = '<option value="">Selecione o convênio</option>';
  selectConvenio.disabled = !empresa;

  if (!empresa) return;

  const convenios = conveniosCache
    .filter(c => c.empresa === empresa)
    .map(c => c.convenio)
    .sort((a, b) => a.localeCompare(b, "pt-BR"));

  convenios.forEach(conv => {
    const opt = document.createElement("option");
    opt.value = conv;
    opt.textContent = conv;
    selectConvenio.appendChild(opt);
  });

  selectConvenio.onchange = () => {
    const selecionado = selectConvenio.value;
    const c = conveniosCache.find(
      x => x.empresa === empresa && x.convenio === selecionado
    );

    if (!c) {
      limparDados();
      return;
    }

    document.getElementById("outConvenio").textContent = c.convenio;

    // 🔗 LINK CLICÁVEL (ativa/desativa corretamente)
    const linkEl = document.getElementById("outLink");
    if (c.link && c.link.trim() !== "") {
      const url = c.link.startsWith("http") ? c.link : "https://" + c.link;
      linkEl.href = url;
      linkEl.target = "_blank";
      linkEl.rel = "noopener noreferrer";
      linkEl.textContent = url;
      linkEl.removeAttribute("aria-disabled");
      linkEl.classList.remove("link-desabilitado");
    } else {
      // Desativa totalmente o clique
      linkEl.textContent = "—";
      linkEl.removeAttribute("href");
      linkEl.removeAttribute("target");
      linkEl.setAttribute("aria-disabled", "true");
      linkEl.classList.add("link-desabilitado");
    }

    document.getElementById("outLogin").textContent = c.login || "—";
    document.getElementById("outSenha").textContent = c.senha || "—";
    document.getElementById("outObservacao").textContent = c.observacao || "—";

    document.getElementById("btnChamado").disabled = false;
  };
}

/* ================= LIMPEZA ================= */
function limparDados() {
  document.getElementById("outEmpresa").textContent = "—";
  document.getElementById("outConvenio").textContent = "—";

  const linkEl = document.getElementById("outLink");
  linkEl.textContent = "—";
  linkEl.removeAttribute("href");
  linkEl.removeAttribute("target");
  linkEl.setAttribute("aria-disabled", "true");
  linkEl.classList.add("link-desabilitado");

  document.getElementById("outLogin").textContent = "—";
  document.getElementById("outSenha").textContent = "—";
  document.getElementById("outObservacao").textContent = "—";

  document.getElementById("btnChamado").disabled = true;
  document.getElementById("selectConvenio").disabled = true;
}
``
