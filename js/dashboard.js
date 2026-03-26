async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}

let conveniosCache = [];

/* ================= INIT ================= */
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

/* ================= EMPRESAS ================= */
function carregarEmpresas() {
  const selectEmpresa = document.getElementById("selectEmpresa");

  // limpa opções mantendo "Selecione"
  selectEmpresa.length = 1;

  const empresas = [...new Set(conveniosCache.map(c => c.empresa))]
    .sort((a, b) => a.localeCompare(b)); // ✅ ordem alfabética

  empresas.forEach(empresa => {
    const opt = document.createElement("option");
    opt.value = empresa;
    opt.textContent = empresa;
    selectEmpresa.appendChild(opt);
  });

  selectEmpresa.selectedIndex = 0;

  let ultimoChar = "";
  let indices = [];
  let idx = 0;

  // digitação para pular por letra
  selectEmpresa.addEventListener("keydown", e => {
    if (e.key.length !== 1 || !/[a-zA-Z]/.test(e.key)) return;

    const letra = e.key.toUpperCase();
    const options = [...selectEmpresa.options];

    if (letra !== ultimoChar) {
      indices = options
        .map((opt, i) => opt.textContent.toUpperCase().startsWith(letra) ? i : -1)
        .filter(i => i > 0);
      idx = 0;
      ultimoChar = letra;
    } else {
      idx = (idx + 1) % indices.length;
    }

    if (indices.length > 0) {
      selectEmpresa.selectedIndex = indices[idx];
      selectEmpresa.dispatchEvent(new Event("change"));
    }
  });

  selectEmpresa.addEventListener("change", () => {
    const empresa = selectEmpresa.value;
    limparDados();

    document.getElementById("outEmpresa").textContent = empresa || "—";
    carregarConvenios(empresa);
  });
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
    .sort((a, b) => a.localeCompare(b)); // ✅ ordem alfabética

  convenios.forEach(conv => {
    const opt = document.createElement("option");
    opt.value = conv;
    opt.textContent = conv;
    selectConvenio.appendChild(opt);
  });

  selectConvenio.selectedIndex = 0;

  let ultimoChar = "";
  let indices = [];
  let idx = 0;

  // digitação para pular por letra
  selectConvenio.addEventListener("keydown", e => {
    if (e.key.length !== 1 || !/[a-zA-Z]/.test(e.key)) return;

    const letra = e.key.toUpperCase();
    const options = [...selectConvenio.options];

    if (letra !== ultimoChar) {
      indices = options
        .map((opt, i) => opt.textContent.toUpperCase().startsWith(letra) ? i : -1)
        .filter(i => i > 0);
      idx = 0;
      ultimoChar = letra;
    } else {
      idx = (idx + 1) % indices.length;
    }

    if (indices.length > 0) {
      selectConvenio.selectedIndex = indices[idx];
      selectConvenio.dispatchEvent(new Event("change"));
    }
  });

  selectConvenio.onchange = () => {
    const convenio = selectConvenio.value;
    const c = conveniosCache.find(
      x => x.empresa === empresa && x.convenio === convenio
    );

    if (!c) return;

