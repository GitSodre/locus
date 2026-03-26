// ===============================
// DASHBOARD.JS - CONSULTA DE CONVÊNIOS
// ===============================

// Cache local dos convênios
let conveniosCache = [];

// Logout
async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}

// Inicialização do dashboard
async function iniciarDashboard() {
  const { data: sessionData } = await supabaseClient.auth.getSession();

  if (!sessionData.session) {
    window.location.href = "index.html";
    return;
  }

  carregarEmpresas();
}

// Carregar empresas (autocomplete)
async function carregarEmpresas() {
  const { data, error } = await supabaseClient
    .from("convenios")
    .select("*")
    .order("empresa");

  if (error) {
    console.error("Erro ao carregar convênios:", error);
    return;
  }

  conveniosCache = data;

  const empresasUnicas = [...new Set(data.map(c => c.empresa))];
  const listaEmpresas = document.getElementById("listaEmpresas");
  listaEmpresas.innerHTML = "";

  empresasUnicas.forEach(empresa => {
    const option = document.createElement("option");
    option.value = empresa;
    listaEmpresas.appendChild(option);
  });
}

// Quando a empresa muda (digitando ou selecionando)
document.getElementById("empresaInput").addEventListener("input", () => {
  const empresa = document.getElementById("empresaInput").value;
  const listaConvenios = document.getElementById("listaConvenios");
  const convenioInput = document.getElementById("convenioInput");

  // Reset visual
  document.getElementById("outEmpresa").textContent = empresa || "—";
  document.getElementById("outConvenio").textContent = "—";
  document.getElementById("outLink").textContent = "—";
  document.getElementById("outLogin").textContent = "—";
  document.getElementById("outSenha").textContent = "—";
  document.getElementById("btnChamado").disabled = true;

  listaConvenios.innerHTML = "";
  convenioInput.value = "";
  convenioInput.disabled = true;

  if (!empresa) return;

  const filtrados = conveniosCache.filter(c => c.empresa === empresa);

  filtrados.forEach(c => {
    const option = document.createElement("option");
    option.value = c.convenio;
    listaConvenios.appendChild(option);
  });

  if (filtrados.length > 0) {
    convenioInput.disabled = false;
  }
});

// Quando o convênio muda
document.getElementById("convenioInput").addEventListener("input", () => {
  const empresa = document.getElementById("empresaInput").value;
  const convenio = document.getElementById("convenioInput").value;

  const registro = conveniosCache.find(
    c => c.empresa === empresa && c.convenio === convenio
  );

  if (!registro) return;

  document.getElementById("outEmpresa").textContent = registro.empresa;
  document.getElementById("outConvenio").textContent = registro.convenio;
  document.getElementById("outLink").textContent = registro.link || "—";
  document.getElementById("outLogin").textContent = registro.login || "—";
  document.getElementById("outSenha").textContent = registro.senha || "—";

  document.getElementById("btnChamado").disabled = false;
});

// Botão de solicitar alteração de senha
document.getElementById("btnChamado").addEventListener("click", () => {
  alert("Solicitação de alteração de senha registrada.\n\n(Próximo passo: abrir chamado no sistema)");
  // Aqui depois você liga com INSERT na tabela 'chamados'
});

// Iniciar dashboard ao carregar
iniciarDashboard();
