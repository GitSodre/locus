<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <title>Dashboard - Locus</title>
  <link rel="stylesheet" href="style.css">
</head>

<body class="dashboard-page">

  <div class="dashboard-container">
    <h1>Dashboard</h1>
    <p>Consulta de convênios</p>

    <div class="filtros-linha">
      <div class="filtro">
        <label>Empresa</label>
        <input id="empresaInput" type="text" autocomplete="off">
        <div id="empresaDropdown" class="dropdown"></div>
      </div>

      <div class="filtro">
        <label>Convênio</label>
        <input id="convenioInput" type="text" autocomplete="off" disabled>
        <div id="convenioDropdown" class="dropdown"></div>
      </div>
    </div>

    <hr>

    <div class="dados-convenio">
      <p><strong>Empresa:</strong> <span id="outEmpresa">—</span></p>
      <p><strong>Convênio:</strong> <span id="outConvenio">—</span></p>
      <p><strong>Link:</strong> <span id="outLink">—</span></p>
      <p><strong>Login:</strong> <span id="outLogin">—</span></p>
      <p><strong>Senha:</strong> <span id="outSenha">—</span></p>

      <button id="btnChamado" disabled>
        Solicitar alteração de senha
      </button>
    </div>

    <button class="btn-sair" onclick="logout()">Sair</button>
  </div>

  <!-- Supabase -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="js/supabase.js"></script>
  <script src="js/dashboard.js"></script>

</body>
</html>
