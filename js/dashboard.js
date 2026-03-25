<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8" />
  <title>Dashboard</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>

  <div class="dashboard-container">
    <h1>Dashboard</h1>
    <p>Bem-vindo ao sistema</p>

    <h2>Convênios</h2>
    <div id="lista-convenios"></div>

    <button onclick="logout()">Sair</button>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="js/supabase.js"></script>
  <script src="js/dashboard.js"></script>
</body>
</html>
