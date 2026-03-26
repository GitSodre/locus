async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}

let conveniosCache = [];

document.addEventListener("DOMContentLoaded", async () => {
  const { data } = await supabaseClient.auth.getSession();
  if (!data.session) {
    window.location.href = "index.html";
    return;
  }

  const { data: convenios } = await supabaseClient
    .from("convenios")
    .select("*");

  conveniosCache = convenios || [];
  carregarEmpresas();
});

function carregarEmpresas() {
  const selectEmpresa = document.getElementById("selectEmpresa");

  // Evita duplicar opções
  if (selectEmpresa.options.length > 1) return;

  const empresas = [...new Set(conveniosCache.map(c => c.empresa))];

  empresas.forEach(empresa => {
    const opt = document.createElement("option");
    opt.value = empresa;
    opt.textContent = empresa;
    selectEmpresa.appendChild(opt);
  });

  selectEmpresa.addEventListener("change", () => {
    const empresa = selectEmpresa.value;
    limparDados();

    document.getElementById("outEmpresa").textContent = empresa || "—";
    carregarConvenios(empresa);
  });

  // ✅ FILTRAR EMPRESAS AO DIGITAR
  selectEmpresa.addEventListener("keyup", function (e) {
    const termo = e.target.value.toLowerCase();

    [...selectEmpresa.options].forEach(opt => {
      if (opt.value === "") return;
      opt.style.display = opt.textContent.toLowerCase().includes(termo)
        ? "block"
        : "none";
    });
  });
}

function carregarConvenios(empresa) {
  const selectConvenio = document.getElementById("selectConvenio");

  selectConvenio.innerHTML = '<option value="">Selecione o convênio</option>';
  selectConvenio.disabled = !empresa;

  conveniosCache
    .filter(c => c.empresa === empresa)
    .forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.convenio;
      opt.textContent = c.convenio;
      selectConvenio.appendChild(opt);
    });

  // Remove listener antigo para evitar duplicação
  selectConvenio.onchange = null;

  selectConvenio.addEventListener("change", () => {
    const convenio = selectConvenio.value;
    const c = conveniosCache.find(
      x => x.empresa === empresa && x.convenio === convenio
    );

    if (!c) return;

    document.getElementById("outConvenio").textContent = c.convenio;
    document.getElementById("outLink").textContent = c.link || "—";
    document.getElementById("outLogin").textContent = c.login || "—";
    document.getElementById("outSenha").textContent = c.senha || "—";

    document.getElementById("btnChamado").disabled = false;
  });

  // ✅ FILTRAR CONVÊNIOS AO DIGITAR
  selectConvenio.addEventListener("keyup", function (e) {
    const termo = e.target.value.toLowerCase();

    [...selectConvenio.options].forEach(opt => {
      if (opt.value === "") return;
      opt.style.display = opt.textContent.toLowerCase().includes(termo)
        ? "block"
        : "none";
    });
  });
}

function limparDados() {
  document.getElementById("outConvenio").textContent = "—";
  document.getElementById("outLink").textContent = "—";
  document.getElementById("outLogin").textContent = "—";
  document.getElementById("outSenha").textContent = "—";
  document.getElementById("btnChamado").disabled = true;
  document.getElementById("selectConvenio").disabled = true;
}
