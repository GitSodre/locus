/*********************************
 * DASHBOARD.JS – VERSÃO FINAL
 *********************************/

// ✅ logout precisa ser global para funcionar no onclick
window.logout = async function logout() {
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

  const { data, error } = await supabaseClient
    .from("convenios")
    .select("*");

  if (error) {
    console.error("Erro ao carregar convênios:", error);
    alert("Não foi possível carregar os convênios.");
    await window.logout();
    return;
  }

  conveniosCache = Array.isArray(data) ? data : [];
  carregarEmpresas();
});

/* ================= EMPRESAS ================= */
function carregarEmpresas() {
  const selectEmpresa = document.getElementById("selectEmpresa");

  // limpa mantendo "Selecione"
  selectEmpresa.length = 1;

  const empresas = [...new Set(conveniosCache.map(c => c.empresa))]
    .sort((a, b) => a.localeCompare(b, "pt-BR"));

  empresas.forEach(empresa => {
    const opt = document.createElement("option");
    opt.value = empresa;
    opt.textContent = empresa;
    selectEmpresa.appendChild(opt);
  });

  prepararNavegacaoPorLetra(selectEmpresa, empresaSelecionada);

  selectEmpresa.onchange = () => {
    empresaSelecionada(selectEmpresa.value);
  };
}

function empresaSelecionada(empresa) {
  limparDados();

  document.getElementById("outEmpresa").textContent = empresa || "—";

  const selectConvenio = document.getElementById("selectConvenio");
  selectConvenio.disabled = !empresa;

  if (!empresa) return;

  carregarConvenios(empresa);
}

/* ================= CONVÊNIOS ================= */
function carregarConvenios(empresa) {
  const selectConvenio = document.getElementById("selectConvenio");

  selectConvenio.innerHTML = '<option value="">Selecione o convênio</option>';

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

  prepararNavegacaoPorLetra(selectConvenio, convenioSelecionado(empresa));

  selectConvenio.onchange = () => {
    convenioSelecionado(empresa)(selectConvenio.value);
  };
}

function convenioSelecionado(empresa) {
  return function (convenio) {
    const c = conveniosCache.find(
      x => x.empresa === empresa && x.convenio === convenio
    );

    if (!c) return;

    document.getElementById("outConvenio").textContent = c.convenio;
    document.getElementById("outLink").textContent = c.link || "—";
    document.getElementById("outLogin").textContent = c.login || "—";
    document.getElementById("outSenha").textContent = c.senha || "—";

    document.getElementById("btnChamado").disabled = false;
  };
}

/* ================= NAVEGAÇÃO POR LETRA ================= */
function prepararNavegacaoPorLetra(select, callback) {
  let ultimoChar = "";
  let indices = [];
  let idx = 0;

  select.onkeydown = e => {
    if (!/^[a-zA-Z]$/.test(e.key)) return;

    const letra = e.key.toUpperCase();
    const options = [...select.options];

    if (letra !== ultimoChar) {
      indices = options
        .map((opt, i) =>
          opt.textContent.toUpperCase().startsWith(letra) ? i : -1
        )
        .filter(i => i > 0);

      idx = 0;
      ultimoChar = letra;
    } else {
      idx = (idx + 1) % indices.length;
    }

    if (indices.length > 0) {
      select.selectedIndex = indices[idx];
      callback(select.value);
    }
  };
}

/* ================= LIMPEZA ================= */
function limparDados() {
  document.getElementById("outEmpresa").textContent = "—";
  document.getElementById("outConvenio").textContent = "—";
  document.getElementById("outLink").textContent = "—";
  document.getElementById("outLogin").textContent = "—";
  document.getElementById("outSenha").textContent = "—";

  document.getElementById("btnChamado").disabled = true;
  document.getElementById("selectConvenio").disabled = true;
}
