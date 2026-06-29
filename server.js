<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SaasIA — Painel Admin</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  :root {
    --bg:#0f1117;--surface:#1a1d27;--surface2:#222636;--border:#2a2e42;
    --accent:#7c6dfa;--accent2:#a78bfa;--green:#22c55e;--red:#ef4444;
    --yellow:#f59e0b;--text:#f1f5f9;--text2:#94a3b8;--text3:#64748b;
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;display:flex;}
  .sidebar{width:220px;background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:100;}
  .logo{padding:20px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;}
  .logo-icon{width:34px;height:34px;background:linear-gradient(135deg,var(--accent),var(--accent2));border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;}
  .logo-text{font-size:16px;font-weight:700;}
  .logo-badge{font-size:10px;color:var(--accent2);font-weight:500;}
  .nav{padding:12px 8px;flex:1;}
  .nav-section{font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;padding:8px 12px 4px;}
  .nav-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;cursor:pointer;margin:1px 0;font-size:13px;color:var(--text2);transition:all .15s;}
  .nav-item:hover{background:var(--surface2);color:var(--text);}
  .nav-item.active{background:rgba(124,109,250,.15);color:var(--accent2);}
  .nav-item .icon{font-size:15px;width:18px;text-align:center;}
  .nav-badge{margin-left:auto;background:var(--accent);color:white;font-size:10px;font-weight:600;padding:2px 6px;border-radius:10px;}
  .sidebar-footer{padding:12px;border-top:1px solid var(--border);}
  .user-card{display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px;cursor:pointer;}
  .user-card:hover{background:var(--surface2);}
  .avatar{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white;flex-shrink:0;}
  .user-info .name{font-size:13px;font-weight:500;}
  .user-info .role{font-size:11px;color:var(--text3);}
  .main{margin-left:220px;flex:1;display:flex;flex-direction:column;min-height:100vh;width:calc(100% - 220px);overflow-x:hidden;}
  .topbar{background:var(--surface);border-bottom:1px solid var(--border);padding:0 24px;height:56px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50;}
  .page-title{font-size:15px;font-weight:600;}
  .topbar-actions{display:flex;align-items:center;gap:12px;}
  .btn{padding:7px 14px;border-radius:7px;font-size:13px;font-weight:500;cursor:pointer;border:none;transition:all .15s;font-family:'Inter',sans-serif;}
  .btn-primary{background:var(--accent);color:white;}
  .btn-primary:hover{background:#6b5ce7;}
  .btn-ghost{background:transparent;color:var(--text2);border:1px solid var(--border);}
  .btn-ghost:hover{background:var(--surface2);color:var(--text);}
  .btn-sm{padding:5px 10px;font-size:12px;}
  .btn-danger{background:rgba(239,68,68,.1);color:var(--red);border:1px solid rgba(239,68,68,.2);}
  .btn-success{background:rgba(34,197,94,.1);color:var(--green);border:1px solid rgba(34,197,94,.2);}
  .content{padding:24px;flex:1;}
  .card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px;}
  .card-title{font-size:13px;color:var(--text2);margin-bottom:8px;font-weight:500;}
  .card-value{font-size:28px;font-weight:700;}
  .card-sub{font-size:12px;color:var(--text3);margin-top:4px;}
  .grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;}
  .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
  .badge{display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:5px;font-size:11px;font-weight:600;}
  .badge-green{background:rgba(34,197,94,.1);color:var(--green);}
  .badge-red{background:rgba(239,68,68,.1);color:var(--red);}
  .badge-yellow{background:rgba(245,158,11,.1);color:var(--yellow);}
  .badge-purple{background:rgba(124,109,250,.1);color:var(--accent2);}
  .dot{width:6px;height:6px;border-radius:50%;background:currentColor;}
  .table-wrap{overflow:auto;}
  table{width:100%;border-collapse:collapse;font-size:13px;}
  th{text-align:left;padding:10px 16px;color:var(--text3);font-weight:500;font-size:11px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--border);}
  td{padding:12px 16px;border-bottom:1px solid var(--border);color:var(--text2);}
  tr:last-child td{border-bottom:none;}
  tr:hover td{background:rgba(255,255,255,.02);}
  td.name{color:var(--text);font-weight:500;}
  .section{display:none;}
  .section.active{display:block;}
  .credit-bar{height:8px;background:var(--surface2);border-radius:4px;overflow:hidden;margin:4px 0;}
  .credit-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,var(--accent),var(--accent2));}
  .form-group{margin-bottom:16px;}
  label{display:block;font-size:12px;color:var(--text2);font-weight:500;margin-bottom:6px;}
  input,textarea,select{width:100%;padding:9px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:7px;color:var(--text);font-size:13px;font-family:'Inter',sans-serif;outline:none;transition:border .15s;}
  input:focus,textarea:focus,select:focus{border-color:var(--accent);}
  textarea{resize:vertical;min-height:80px;}
  select option{background:var(--surface2);}
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:200;opacity:0;pointer-events:none;transition:opacity .2s;}
  .modal-overlay.open{opacity:1;pointer-events:all;}
  .modal{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:24px;width:520px;max-width:95vw;max-height:90vh;overflow-y:auto;transform:translateY(20px);transition:transform .2s;}
  .modal-overlay.open .modal{transform:translateY(0);}
  .modal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}
  .modal-title{font-size:15px;font-weight:600;}
  .modal-close{background:none;border:none;color:var(--text3);cursor:pointer;font-size:18px;padding:4px;}
  .toast{position:fixed;bottom:24px;right:24px;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px 18px;font-size:13px;z-index:999;transform:translateY(100px);opacity:0;transition:all .3s;max-width:320px;}
  .toast.show{transform:translateY(0);opacity:1;}
  .toast.success{border-color:var(--green);color:var(--green);}
  .toast.error{border-color:var(--red);color:var(--red);}
  .conv-item{display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--surface2);border-radius:8px;cursor:pointer;transition:all .15s;border:1px solid transparent;margin-bottom:8px;}
  .conv-item:hover,.conv-item.selected{border-color:var(--accent);background:rgba(124,109,250,.08);}
  .conv-avatar{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#0f1117;flex-shrink:0;}
  .conv-body{flex:1;min-width:0;}
  .conv-name{font-size:13px;font-weight:600;color:var(--text);}
  .conv-preview{font-size:12px;color:var(--text3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;}
  .conv-time{font-size:11px;color:var(--text3);white-space:nowrap;}
  .chat-window{display:flex;flex-direction:column;height:420px;background:var(--surface2);border-radius:8px;overflow:hidden;}
  .chat-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;}
  .msg{max-width:78%;}
  .msg-in{align-self:flex-start;}
  .msg-out{align-self:flex-end;}
  .msg-bubble{padding:10px 14px;border-radius:12px;font-size:13px;line-height:1.5;white-space:pre-wrap;word-break:break-word;}
  .msg-in .msg-bubble{background:var(--surface);color:var(--text);border-bottom-left-radius:4px;}
  .msg-out .msg-bubble{background:var(--accent);color:white;border-bottom-right-radius:4px;}
  .msg-time{font-size:10px;color:var(--text3);margin-top:3px;padding:0 4px;}
  .msg-out .msg-time{text-align:right;}
  .faq-item{background:var(--surface2);border-radius:8px;padding:14px;margin-bottom:8px;}
  .tabs{display:flex;gap:4px;border-bottom:1px solid var(--border);margin-bottom:24px;}
  .tab{padding:10px 16px;font-size:13px;cursor:pointer;color:var(--text2);border-bottom:2px solid transparent;margin-bottom:-1px;transition:all .15s;font-weight:500;}
  .tab:hover{color:var(--text);}
  .tab.active{color:var(--accent2);border-bottom-color:var(--accent);}
  ::-webkit-scrollbar{width:4px;height:4px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px;}
  .empty-state{text-align:center;padding:40px;color:var(--text3);}
  .empty-state .icon{font-size:40px;margin-bottom:12px;}
  .empty-state p{font-size:13px;}
  .transferencia-badge{background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);color:var(--red);font-size:11px;font-weight:600;padding:2px 8px;border-radius:4px;margin-left:8px;}
</style>
</head>
<body>

<aside class="sidebar">
  <div class="logo">
    <div class="logo-icon">🤖</div>
    <div>
      <div class="logo-text">SaasIA</div>
      <div class="logo-badge">Admin Panel</div>
    </div>
  </div>
  <nav class="nav">
    <div class="nav-section">Principal</div>
    <div class="nav-item active" onclick="showSection('dashboard',this)"><span class="icon">📊</span> Dashboard</div>
    <div class="nav-item" onclick="showSection('clinicas',this)"><span class="icon">🏥</span> Clínicas</div>
    <div class="nav-section" style="margin-top:12px">WhatsApp</div>
    <div class="nav-item" onclick="showSection('whatsapp',this)"><span class="icon">📱</span> Conexões</div>
    <div class="nav-section" style="margin-top:12px">Financeiro</div>
    <div class="nav-item" onclick="showSection('creditos',this)"><span class="icon">💳</span> Créditos</div>
    <div class="nav-section" style="margin-top:12px">Sistema</div>
    <div class="nav-item" onclick="showSection('medicos',this)"><span class="icon">👨‍⚕️</span> Médicos</div>
    <div class="nav-item" onclick="showSection('config',this)"><span class="icon">⚙️</span> Configurações</div>
  </nav>
  <div class="sidebar-footer">
    <div class="user-card">
      <div class="avatar">HP</div>
      <div class="user-info">
        <div class="name">Hemerson</div>
        <div class="role">Administrador</div>
      </div>
    </div>
  </div>
</aside>

<main class="main">
  <div class="topbar">
    <div class="page-title" id="page-title">Dashboard</div>
    <div class="topbar-actions">
      <button class="btn btn-primary btn-sm" onclick="openModal('modal-nova-clinica')">+ Nova Clínica</button>
    </div>
  </div>

  <div class="content">

    <!-- DASHBOARD -->
    <section class="section active" id="section-dashboard">
      <div class="grid-4">
        <div class="card"><div class="card-title">Clínicas ativas</div><div class="card-value" id="stat-clinicas">—</div><div class="card-sub">Total cadastradas</div></div>
        <div class="card"><div class="card-title">Mensagens hoje</div><div class="card-value" id="stat-msgs">—</div><div class="card-sub">Atendimentos IA</div></div>
        <div class="card"><div class="card-title">Conversas abertas</div><div class="card-value" id="stat-convs">—</div><div class="card-sub">Últimas 24h</div></div>
        <div class="card"><div class="card-title">Transferências</div><div class="card-value" id="stat-transf" style="color:var(--yellow)">—</div><div class="card-sub">Aguardando humano</div></div>
      </div>
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <div style="font-size:14px;font-weight:600">Clínicas</div>
          <button class="btn btn-ghost btn-sm" onclick="showSection('clinicas',document.querySelectorAll('.nav-item')[1])">Ver todas →</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Nome</th><th>Plano</th><th>WhatsApp</th><th>Status</th></tr></thead>
            <tbody id="dash-table"><tr><td colspan="4" style="text-align:center;color:var(--text3);padding:20px">Carregando...</td></tr></tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- CLÍNICAS -->
    <section class="section" id="section-clinicas">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <div><div style="font-size:18px;font-weight:700">Clínicas</div><div style="font-size:13px;color:var(--text3);margin-top:2px" id="clinicas-count">Carregando...</div></div>
        <button class="btn btn-primary" onclick="openModal('modal-nova-clinica')">+ Adicionar clínica</button>
      </div>
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Nome</th><th>Plano</th><th>WhatsApp</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody id="clinicas-table"><tr><td colspan="5" style="text-align:center;color:var(--text3);padding:20px">Carregando...</td></tr></tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- CONVERSAS -->
    <section class="section" id="section-conversas">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
        <button class="btn btn-ghost btn-sm" onclick="showSection('clinicas',document.querySelectorAll('.nav-item')[1])">← Voltar</button>
        <div>
          <div style="font-size:18px;font-weight:700">Conversas — <span id="conv-clinica-nome" style="color:var(--accent2)">—</span></div>
          <div style="font-size:13px;color:var(--text3);margin-top:2px">Histórico de atendimentos da clínica</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:16px">
        <input placeholder="🔍  Buscar por nome ou número..." style="max-width:280px" id="conv-search" oninput="filterConversas()">
        <select style="width:160px" id="conv-status" onchange="loadConversas()">
          <option value="">Todos os status</option>
          <option value="ativa">Ativas</option>
          <option value="transferida">Transferidas</option>
          <option value="resolvida">Resolvidas</option>
        </select>
      </div>
      <div class="grid-2">
        <div>
          <div id="conv-list"><div class="empty-state"><div class="icon">💬</div><p>Carregando conversas...</p></div></div>
        </div>
        <div>
          <div class="card" id="chat-panel" style="display:none;flex-direction:column">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
              <div style="display:flex;align-items:center;gap:10px">
                <div class="conv-avatar" id="chat-avatar" style="background:linear-gradient(135deg,#4ade80,#22d3ee)">?</div>
                <div>
                  <div style="font-size:13px;font-weight:600" id="chat-name">—</div>
                  <div style="font-size:11px;color:var(--text3)" id="chat-phone">—</div>
                </div>
              </div>
              <div style="display:flex;gap:6px;align-items:center">
                <span id="chat-status-badge"></span>
                <a id="chat-wa-link" href="#" target="_blank" class="btn btn-success btn-sm" style="text-decoration:none;display:none">📱 Abrir WhatsApp</a>
                <button class="btn btn-ghost btn-sm" onclick="fecharChat()">✕</button>
              </div>
            </div>
            <div class="chat-window">
              <div class="chat-messages" id="chat-messages"></div>
            </div>
          </div>
          <div class="card" id="chat-empty" style="display:flex;align-items:center;justify-content:center;min-height:200px">
            <div class="empty-state"><div class="icon">💬</div><p>Selecione uma conversa</p></div>
          </div>
        </div>
      </div>
    </section>

    <!-- WHATSAPP -->
    <section class="section" id="section-whatsapp">
      <div style="margin-bottom:20px"><div style="font-size:18px;font-weight:700">Conexões WhatsApp</div><div style="font-size:13px;color:var(--text3);margin-top:2px">Gerencie os números conectados de cada clínica</div></div>
      <div id="wa-list"><div class="empty-state"><div class="icon">📱</div><p>Carregando...</p></div></div>
    </section>

    <!-- CRÉDITOS -->
    <section class="section" id="section-creditos">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <div><div style="font-size:18px;font-weight:700">Créditos</div><div style="font-size:13px;color:var(--text3);margin-top:2px">Gerencie e adicione créditos por clínica</div></div>
      </div>
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Clínica</th><th>Plano</th><th>Créditos restantes</th><th>Limite mensal</th><th>Ações</th></tr></thead>
            <tbody id="creditos-table"><tr><td colspan="5" style="text-align:center;color:var(--text3);padding:20px">Carregando...</td></tr></tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- MÉDICOS -->
    <section class="section" id="section-medicos">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <div>
          <div style="font-size:18px;font-weight:700">Médicos</div>
          <div style="font-size:13px;color:var(--text3);margin-top:2px">Gerencie os médicos de cada clínica</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:16px">
        <select style="width:220px" id="medicos-clinica-select" onchange="loadMedicos()">
          <option value="">Selecione a clínica</option>
        </select>
        <button class="btn btn-primary btn-sm" onclick="openModal('modal-novo-medico')">+ Adicionar médico</button>
      </div>
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Nome</th><th>Especialidade</th><th>Calendar ID</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody id="medicos-table"><tr><td colspan="5" style="text-align:center;color:var(--text3);padding:20px">Selecione uma clínica</td></tr></tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- CONFIG -->
    <section class="section" id="section-config">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
        <div style="font-size:18px;font-weight:700">Configurações</div>
        <select id="config-clinica-select" style="width:200px" onchange="loadConfig()">
          <option value="">Selecione a clínica</option>
        </select>
      </div>
      <div id="config-content" style="display:none">
        <div class="tabs">
          <div class="tab active" onclick="switchTab(this,'cfg-prompt')">System Prompt</div>
          <div class="tab" onclick="switchTab(this,'cfg-faq')">FAQ</div>
          <div class="tab" onclick="switchTab(this,'cfg-dados')">Dados da Clínica</div>
        </div>
        <div id="cfg-prompt">
          <div class="card">
            <div class="form-group"><label>System Prompt da IA (salvo diretamente na clínica)</label><textarea id="prompt-text" style="min-height:300px" placeholder="Você é uma recepcionista virtual..."></textarea></div>
            <button class="btn btn-primary" onclick="savePrompt()">💾 Salvar prompt</button>
          </div>
        </div>
        <div id="cfg-faq" style="display:none">
          <div class="card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
              <div style="font-size:14px;font-weight:600">Perguntas frequentes</div>
              <button class="btn btn-primary btn-sm" onclick="openModal('modal-nova-faq')">+ Adicionar</button>
            </div>
            <div id="faq-list"><div class="empty-state"><p>Carregando FAQ...</p></div></div>
          </div>
        </div>
        <div id="cfg-dados" style="display:none">
          <div class="card">
            <div class="form-group"><label>Nome da clínica</label><input id="cfg-nome" placeholder="Nome da clínica"></div>
            <div class="form-group"><label>Plano</label>
              <select id="cfg-plano">
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div class="form-group"><label>Créditos mensais</label><input id="cfg-creditos" type="number" placeholder="5000"></div>
            <div class="form-group"><label>Phone Number ID (Meta)</label><input id="cfg-phone-id" placeholder="1237032046153902"></div>
            <div class="form-group"><label>Número para notificações (transferência para humano)</label><input id="cfg-numero-notif" placeholder="5562999999999"></div>
            <div class="form-group"><label>Status</label>
              <select id="cfg-ativo">
                <option value="true">Ativa</option>
                <option value="false">Inativa</option>
              </select>
            </div>
            <div style="border-top:1px solid var(--border);margin:20px 0;padding-top:20px">
              <div style="font-size:13px;font-weight:600;margin-bottom:16px">🔐 Acesso ao Portal da Clínica</div>
              <div class="form-group"><label>Email de acesso</label><input id="cfg-email" type="email" placeholder="clinica@email.com"></div>
              <div class="form-group"><label>Senha de acesso</label><input id="cfg-senha" type="text" placeholder="senha123"></div>
              <div style="background:rgba(124,109,250,.08);border:1px solid rgba(124,109,250,.2);border-radius:8px;padding:12px;font-size:12px;color:var(--text2);margin-bottom:16px">
                💡 Envie essas credenciais para a clínica acessar o portal em <strong style="color:var(--accent2)">saasia-clinica.vercel.app</strong>
              </div>
            </div>
            <button class="btn btn-primary" onclick="saveDados()">💾 Salvar dados</button>
          </div>
        </div>
      </div>
      <div id="config-empty" class="empty-state"><div class="icon">⚙️</div><p>Selecione uma clínica para editar</p></div>
    </section>

  </div>
</main>

<!-- Modal Nova Clínica -->
<div class="modal-overlay" id="modal-nova-clinica">
  <div class="modal">
    <div class="modal-header"><div class="modal-title">Nova clínica</div><button class="modal-close" onclick="closeModal('modal-nova-clinica')">✕</button></div>
    <div class="form-group"><label>Nome da clínica *</label><input id="nc-nome" placeholder="Ex: Bella Pele Clínica Estética"></div>
    <div class="form-group"><label>Slug (identificador único) *</label><input id="nc-slug" placeholder="bella-pele"></div>
    <div class="form-group"><label>Plano</label>
      <select id="nc-plano"><option value="basic">Basic</option><option value="pro">Pro</option><option value="enterprise">Enterprise</option></select>
    </div>
    <div class="form-group"><label>Créditos iniciais</label><input id="nc-creditos" type="number" value="2000"></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
      <button class="btn btn-ghost" onclick="closeModal('modal-nova-clinica')">Cancelar</button>
      <button class="btn btn-primary" onclick="criarClinica()">Criar clínica</button>
    </div>
  </div>
</div>

<!-- Modal Créditos -->
<div class="modal-overlay" id="modal-creditos">
  <div class="modal">
    <div class="modal-header"><div class="modal-title">Adicionar créditos</div><button class="modal-close" onclick="closeModal('modal-creditos')">✕</button></div>
    <div style="background:var(--surface2);border-radius:8px;padding:16px;margin-bottom:16px">
      <div style="font-size:12px;color:var(--text3)">Clínica selecionada</div>
      <div style="font-size:16px;font-weight:700;margin-top:4px" id="cred-clinica-nome">—</div>
      <div style="font-size:13px;color:var(--text2);margin-top:4px">Saldo atual: <strong id="cred-saldo-atual">—</strong></div>
    </div>
    <input type="hidden" id="cred-clinica-id">
    <div class="form-group"><label>Quantidade de créditos a adicionar</label><input id="cred-qtd" type="number" value="1000" min="1"></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
      <button class="btn btn-ghost" onclick="closeModal('modal-creditos')">Cancelar</button>
      <button class="btn btn-primary" onclick="adicionarCreditos()">Confirmar recarga</button>
    </div>
  </div>
</div>

<!-- Modal Nova FAQ -->
<div class="modal-overlay" id="modal-nova-faq">
  <div class="modal">
    <div class="modal-header"><div class="modal-title" id="faq-modal-title">Nova pergunta</div><button class="modal-close" onclick="closeModal('modal-nova-faq')">✕</button></div>
    <input type="hidden" id="faq-id">
    <div class="form-group"><label>Pergunta *</label><input id="faq-pergunta" placeholder="Ex: Quais tratamentos vocês oferecem?"></div>
    <div class="form-group"><label>Resposta *</label><textarea id="faq-resposta" style="min-height:120px" placeholder="Resposta completa..."></textarea></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
      <button class="btn btn-ghost" onclick="closeModal('modal-nova-faq')">Cancelar</button>
      <button class="btn btn-primary" onclick="salvarFaq()">Salvar</button>
    </div>
  </div>
</div>

<!-- Modal Editar Clínica -->
<div class="modal-overlay" id="modal-editar-clinica">
  <div class="modal">
    <div class="modal-header"><div class="modal-title">Editar clínica</div><button class="modal-close" onclick="closeModal('modal-editar-clinica')">✕</button></div>
    <input type="hidden" id="edit-id">
    <div class="form-group"><label>Nome</label><input id="edit-nome"></div>
    <div class="form-group"><label>Plano</label>
      <select id="edit-plano"><option value="basic">Basic</option><option value="pro">Pro</option><option value="enterprise">Enterprise</option></select>
    </div>
    <div class="form-group"><label>Status</label>
      <select id="edit-ativo"><option value="true">Ativa</option><option value="false">Inativa</option></select>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
      <button class="btn btn-ghost" onclick="closeModal('modal-editar-clinica')">Cancelar</button>
      <button class="btn btn-primary" onclick="salvarEdicao()">Salvar</button>
    </div>
  </div>
</div>

<!-- Modal Novo Médico -->
<div class="modal-overlay" id="modal-novo-medico">
  <div class="modal">
    <div class="modal-header"><div class="modal-title" id="medico-modal-title">Novo médico</div><button class="modal-close" onclick="closeModal('modal-novo-medico')">✕</button></div>
    <input type="hidden" id="medico-id">
    <div class="form-group"><label>Nome completo *</label><input id="medico-nome" placeholder="Dr. João Silva"></div>
    <div class="form-group"><label>Especialidade</label><input id="medico-especialidade" placeholder="Dermatologia, Estética, etc."></div>
    <div class="form-group"><label>Google Calendar ID</label><input id="medico-calendar-id" placeholder="xxx@group.calendar.google.com"></div>
    <div class="form-group"><label>Status</label>
      <select id="medico-ativo">
        <option value="true">Ativo</option>
        <option value="false">Inativo</option>
      </select>
    </div>
    <div style="background:rgba(124,109,250,.08);border:1px solid rgba(124,109,250,.2);border-radius:8px;padding:12px;font-size:12px;color:var(--text2);margin-bottom:16px">
      💡 O Calendar ID é o identificador do Google Calendar individual do médico. Crie um calendário para cada médico e compartilhe com a conta de serviço <strong style="color:var(--accent2)">saasia-calendar@gen-lang-client-0359927307.iam.gserviceaccount.com</strong>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end">
      <button class="btn btn-ghost" onclick="closeModal('modal-novo-medico')">Cancelar</button>
      <button class="btn btn-primary" onclick="salvarMedico()">Salvar</button>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
const SB = 'https://ecbaosdbzqnhfabsjmng.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjYmFvc2RienFuaGZhYnNqbW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1Mzc4NDgsImV4cCI6MjA5NTExMzg0OH0.D28TDbco_WbraWAVpQwFy8LF02cj2VO1Cz_zsQy1BQA';
const H = {'apikey':KEY,'Authorization':'Bearer '+KEY,'Content-Type':'application/json','Prefer':'return=minimal'};

async function api(path, method='GET', body){
  const opts = {method, headers:H};
  if(body) opts.body = JSON.stringify(body);
  const r = await fetch(SB+'/rest/v1/'+path, opts);
  const text = await r.text();
  if(!r.ok) throw new Error(text);
  try { return text ? JSON.parse(text) : null; } catch(e) { return null; }
}

function toast(msg, type='success'){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => t.classList.remove('show'), 3000);
}

function showSection(id, el){
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById('section-'+id).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if(el) el.classList.add('active');
  const titles = {dashboard:'Dashboard',clinicas:'Clínicas',conversas:'Conversas',whatsapp:'Conexões WhatsApp',creditos:'Créditos',config:'Configurações'};
  document.getElementById('page-title').textContent = titles[id]||id;
  if(id==='clinicas') loadClinicas();
  if(id==='conversas') loadConversas();
  if(id==='creditos') loadCreditos();
  if(id==='whatsapp') loadWA();
  if(id==='medicos') { loadConfigSelect(); loadMedicos(); }
  if(id==='config') loadConfigSelect();
}

function openModal(id){ document.getElementById(id).classList.add('open'); }
function closeModal(id){ document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(o => o.addEventListener('click', function(e){ if(e.target===this) this.classList.remove('open'); }));

let clinicasData = [];

async function loadDashboard(){
  try{
    const t = await api('tenants?select=*&order=nome');
    clinicasData = t;
    const elClin = document.getElementById('stat-clinicas');
    if(elClin) elClin.textContent = t.filter(c => c.ativo !== false).length;

    // Conversas das últimas 24h
    const ontem = new Date(Date.now()-86400000).toISOString();
    const convs = await api(`conversas?select=id,status&iniciado_em=gte.${ontem}`);
    const elConvs = document.getElementById('stat-convs');
    if(elConvs) elConvs.textContent = convs.length;

    // Mensagens de hoje
    const msgs = await api(`mensagens?select=id&enviado_em=gte.${ontem}`);
    const elMsgs = document.getElementById('stat-msgs');
    if(elMsgs) elMsgs.textContent = msgs.length;

    // Transferências pendentes
    const transf = await api(`conversas?select=id&status=eq.transferida`);
    const elTransf = document.getElementById('stat-transf');
    if(elTransf) elTransf.textContent = transf.length;

    const tb = document.getElementById('dash-table');
    if(tb) tb.innerHTML = t.map(c => `
      <tr>
        <td class="name">${c.nome||c.slug}</td>
        <td><span class="badge badge-purple">${c.plano||'basic'}</span></td>
        <td>${c.whatsapp_phone_id?'<span class="badge badge-green"><span class="dot"></span>Conectado</span>':'<span class="badge badge-red"><span class="dot"></span>Não conectado</span>'}</td>
        <td><span class="badge ${c.ativo!==false?'badge-green':'badge-red'}">${c.ativo!==false?'Ativa':'Inativa'}</span></td>
      </tr>`).join('') || '<tr><td colspan="4" style="text-align:center;color:var(--text3);padding:20px">Nenhuma clínica</td></tr>';

    updateSelects(t);
  }catch(e){ toast('Erro ao carregar dashboard: '+e.message,'error'); }
}

function updateSelects(t){
  ['config-clinica-select','medicos-clinica-select'].forEach(id => {
    const s = document.getElementById(id);
    const v = s.value;
    const def = '<option value="">Selecione a clínica</option>';
    s.innerHTML = def + t.map(c => `<option value="${c.id}">${c.nome||c.slug}</option>`).join('');
    if(v) s.value = v;
  });
}

async function loadClinicas(){
  const tb = document.getElementById('clinicas-table');
  tb.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:20px">Carregando...</td></tr>';
  try{
    const t = await api('tenants?select=*&order=nome');
    clinicasData = t;
    document.getElementById('clinicas-count').textContent = `${t.length} clínica${t.length!==1?'s':''} cadastrada${t.length!==1?'s':''}`;
    tb.innerHTML = t.map(c => `
      <tr>
        <td class="name">${c.nome||c.slug}</td>
        <td><span class="badge badge-purple">${c.plano||'basic'}</span></td>
        <td>${c.whatsapp_phone_id?'<span class="badge badge-green"><span class="dot"></span>Ativo</span>':'<span class="badge badge-red"><span class="dot"></span>Não conectado</span>'}</td>
        <td><span class="badge ${c.ativo!==false?'badge-green':'badge-red'}">${c.ativo!==false?'Ativa':'Inativa'}</span></td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn btn-ghost btn-sm" onclick="verConversas('${c.id}','${c.nome||c.slug}')">💬</button>
            <button class="btn btn-ghost btn-sm" onclick="editarClinica('${c.id}')">✏️</button>
            <button class="btn btn-ghost btn-sm" onclick="abrirCreditos('${c.id}','${c.nome||c.slug}',${c.creditos||0})">💳</button>
            <button class="btn btn-ghost btn-sm" onclick="irConfig('${c.id}')">⚙️</button>
          </div>
        </td>
      </tr>`).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:20px">Nenhuma clínica</td></tr>';
    updateSelects(t);
  }catch(e){ tb.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--red);padding:20px">Erro: '+e.message+'</td></tr>'; }
}

async function criarClinica(){
  const nome = document.getElementById('nc-nome').value.trim();
  const slug = document.getElementById('nc-slug').value.trim();
  if(!nome||!slug){ toast('Nome e slug são obrigatórios','error'); return; }
  try{
    await api('tenants','POST',{nome,slug,plano:document.getElementById('nc-plano').value,creditos:parseInt(document.getElementById('nc-creditos').value)||2000,credito_mensal:parseInt(document.getElementById('nc-creditos').value)||2000,ativo:true});
    closeModal('modal-nova-clinica');
    toast('Clínica criada com sucesso!');
    loadClinicas(); loadDashboard();
    document.getElementById('nc-nome').value='';
    document.getElementById('nc-slug').value='';
  }catch(e){ toast('Erro ao criar: '+e.message,'error'); }
}

function editarClinica(id){
  const c = clinicasData.find(x=>x.id==id);
  if(!c) return;
  document.getElementById('edit-id').value = c.id;
  document.getElementById('edit-nome').value = c.nome||'';
  document.getElementById('edit-plano').value = c.plano||'basic';
  document.getElementById('edit-ativo').value = String(c.ativo!==false);
  openModal('modal-editar-clinica');
}

async function salvarEdicao(){
  const id = document.getElementById('edit-id').value;
  try{
    await api(`tenants?id=eq.${id}`,'PATCH',{nome:document.getElementById('edit-nome').value,plano:document.getElementById('edit-plano').value,ativo:document.getElementById('edit-ativo').value==='true'});
    closeModal('modal-editar-clinica');
    toast('Clínica atualizada!');
    loadClinicas(); loadDashboard();
  }catch(e){ toast('Erro: '+e.message,'error'); }
}

function abrirCreditos(id, nome, saldo){
  document.getElementById('cred-clinica-id').value = id;
  document.getElementById('cred-clinica-nome').textContent = nome;
  document.getElementById('cred-saldo-atual').textContent = saldo+' créditos';
  openModal('modal-creditos');
}

async function adicionarCreditos(){
  const id = document.getElementById('cred-clinica-id').value;
  const qtd = parseInt(document.getElementById('cred-qtd').value);
  const c = clinicasData.find(x=>x.id==id);
  const novoSaldo = (c?.creditos||0)+qtd;
  try{
    await api(`tenants?id=eq.${id}`,'PATCH',{creditos:novoSaldo});
    closeModal('modal-creditos');
    toast(`+${qtd} créditos adicionados!`);
    loadClinicas(); loadDashboard(); loadCreditos();
  }catch(e){ toast('Erro: '+e.message,'error'); }
}

async function loadCreditos(){
  const tb = document.getElementById('creditos-table');
  try{
    const t = await api('tenants?select=*&order=nome');
    clinicasData = t;
    tb.innerHTML = t.map(c => {
      const pct = Math.min(100,Math.round(((c.creditos||0)/(c.credito_mensal||5000))*100));
      const cor = c.creditos<200?'var(--red)':c.creditos<500?'var(--yellow)':'var(--green)';
      return `<tr>
        <td class="name">${c.nome||c.slug}</td>
        <td><span class="badge badge-purple">${c.plano||'basic'}</span></td>
        <td>
          <div style="font-weight:600;color:${cor}">${c.creditos||0}</div>
          <div class="credit-bar" style="width:150px"><div class="credit-fill" style="width:${pct}%;${c.creditos<500?'background:'+cor:''}"></div></div>
          <div style="font-size:11px;color:var(--text3)">${pct}% restante</div>
        </td>
        <td>${c.credito_mensal||2000}/mês</td>
        <td><button class="btn btn-primary btn-sm" onclick="abrirCreditos('${c.id}','${c.nome||c.slug}',${c.creditos||0})">+ Adicionar</button></td>
      </tr>`;
    }).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:20px">Nenhuma clínica</td></tr>';
  }catch(e){ tb.innerHTML = '<tr><td colspan="5" style="color:var(--red);padding:20px">Erro: '+e.message+'</td></tr>'; }
}

// ── CONVERSAS (usa tabela conversas + mensagens com estrutura real) ──
let conversasData = [];
let convClinicaId = null;

function verConversas(clinicaId, clinicaNome){
  convClinicaId = clinicaId;
  document.getElementById('conv-clinica-nome').textContent = clinicaNome;
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById('section-conversas').classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-title').textContent = 'Conversas';
  loadConversas();
}

async function loadConversas(){
  const status = document.getElementById('conv-status').value;
  const list = document.getElementById('conv-list');
  list.innerHTML = '<div class="empty-state"><p>Carregando...</p></div>';
  if(!convClinicaId){
    list.innerHTML = '<div class="empty-state"><div class="icon">💬</div><p>Selecione uma clínica para ver as conversas</p></div>';
    return;
  }
  try{
    let q = `conversas?tenant_id=eq.${convClinicaId}&select=*&order=iniciado_em.desc&limit=100`;
    if(status) q += '&status=eq.'+status;
    const convs = await api(q);
    conversasData = convs;
    if(!convs.length){
      list.innerHTML = '<div class="empty-state"><div class="icon">💬</div><p>Nenhuma conversa encontrada</p></div>';
      return;
    }
    renderConvList(convs);
  }catch(e){ list.innerHTML = '<div class="empty-state"><p style="color:var(--red)">Erro: '+e.message+'</p></div>'; }
}

const avatarColors = [
  'linear-gradient(135deg,#4ade80,#22d3ee)',
  'linear-gradient(135deg,#f472b6,#c084fc)',
  'linear-gradient(135deg,#fb923c,#fbbf24)',
  'linear-gradient(135deg,#818cf8,#c084fc)'
];

function renderConvList(data){
  const list = document.getElementById('conv-list');
  const q = document.getElementById('conv-search').value.toLowerCase();
  const filtered = q ? data.filter(c => (c.cliente_telefone||'').includes(q)||(c.cliente_nome||'').toLowerCase().includes(q)) : data;
  if(!filtered.length){
    list.innerHTML = '<div class="empty-state"><div class="icon">💬</div><p>Nenhuma conversa encontrada</p></div>';
    return;
  }
  list.innerHTML = filtered.map((c,i) => {
    const initials = (c.cliente_nome||c.cliente_telefone||'?').substring(0,2).toUpperCase();
    const time = new Date(c.iniciado_em).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
    const isTransf = c.status === 'transferida';
    return `<div class="conv-item" onclick="openChat('${c.id}', ${i})" id="conv-${c.id}">
      <div class="conv-avatar" style="background:${avatarColors[i%4]}">${initials}</div>
      <div class="conv-body">
        <div class="conv-name">
          ${c.cliente_nome||c.cliente_telefone||'Desconhecido'}
          ${isTransf?'<span class="transferencia-badge">⚠️ Transferida</span>':''}
        </div>
        <div class="conv-preview">${c.resumo||'Clique para ver a conversa'}</div>
      </div>
      <div class="conv-time">${time}</div>
    </div>`;
  }).join('');
}

function filterConversas(){
  renderConvList(conversasData);
}

async function openChat(convId, idx){
  const c = conversasData[idx];
  document.querySelectorAll('.conv-item').forEach(el => el.classList.remove('selected'));
  const el = document.getElementById('conv-'+convId);
  if(el) el.classList.add('selected');

  document.getElementById('chat-name').textContent = c.cliente_nome || c.cliente_telefone || 'Desconhecido';
  document.getElementById('chat-phone').textContent = c.cliente_telefone ? '+'+c.cliente_telefone : '—';
  document.getElementById('chat-avatar').textContent = (c.cliente_nome||c.cliente_telefone||'?').substring(0,2).toUpperCase();

  // Badge de status
  const statusBadge = document.getElementById('chat-status-badge');
  const statusMap = {ativa:'badge-green',transferida:'badge-red',resolvida:'badge-purple',abandonada:'badge-yellow'};
  statusBadge.innerHTML = c.status ? `<span class="badge ${statusMap[c.status]||'badge-purple'}">${c.status}</span>` : '';

  // Link WhatsApp
  const waLink = document.getElementById('chat-wa-link');
  if(c.cliente_telefone){
    waLink.href = `https://wa.me/${c.cliente_telefone}`;
    waLink.style.display = 'inline-flex';
  } else {
    waLink.style.display = 'none';
  }

  document.getElementById('chat-panel').style.display = 'flex';
  document.getElementById('chat-panel').style.flexDirection = 'column';
  document.getElementById('chat-empty').style.display = 'none';

  // Carrega mensagens
  const msgs = document.getElementById('chat-messages');
  msgs.innerHTML = '<div style="text-align:center;color:var(--text3);padding:20px;font-size:12px">Carregando...</div>';

  try{
    const mensagens = await api(`mensagens?conversa_id=eq.${convId}&select=remetente,conteudo,enviado_em&order=enviado_em.asc`);
    if(!mensagens.length){
      msgs.innerHTML = '<div style="text-align:center;color:var(--text3);padding:20px;font-size:12px">Nenhuma mensagem</div>';
      return;
    }
    msgs.innerHTML = mensagens.map(m => `
      <div class="msg ${m.remetente==='cliente'?'msg-in':'msg-out'}">
        <div class="msg-bubble">${m.conteudo||''}</div>
        <div class="msg-time">${new Date(m.enviado_em||Date.now()).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}${m.remetente==='ia'?' · Sofia':''}</div>
      </div>`).join('');
    msgs.scrollTop = msgs.scrollHeight;
  }catch(e){
    msgs.innerHTML = '<div style="text-align:center;color:var(--red);padding:20px;font-size:12px">Erro: '+e.message+'</div>';
  }
}

function fecharChat(){
  document.getElementById('chat-panel').style.display = 'none';
  document.getElementById('chat-empty').style.display = 'flex';
  document.querySelectorAll('.conv-item').forEach(el => el.classList.remove('selected'));
}

async function loadWA(){
  const list = document.getElementById('wa-list');
  try{
    const t = await api('tenants?select=*&order=nome');
    if(!t.length){ list.innerHTML = '<div class="empty-state"><div class="icon">📱</div><p>Nenhuma clínica</p></div>'; return; }
    list.innerHTML = t.map(c => `
      <div class="card" style="margin-bottom:12px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <div style="font-size:14px;font-weight:600">${c.nome||c.slug}</div>
          <span class="badge ${c.whatsapp_phone_id?'badge-green':'badge-red'}"><span class="dot"></span>${c.whatsapp_phone_id?'Configurado':'Não conectado'}</span>
        </div>
        ${c.whatsapp_phone_id?`
          <div style="background:var(--surface2);border-radius:8px;padding:14px;display:flex;align-items:center;gap:12px;margin-bottom:12px">
            <div style="font-size:24px">📱</div>
            <div>
              <div style="font-size:12px;color:var(--text3)">Phone Number ID</div>
              <div style="font-size:13px;font-family:monospace;font-weight:600">${c.whatsapp_phone_id}</div>
            </div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-ghost btn-sm" onclick="editarWA('${c.id}','${c.whatsapp_phone_id||''}')">✏️ Editar</button>
            <button class="btn btn-danger btn-sm" onclick="desconectarWA('${c.id}')">Desconectar</button>
          </div>
        `:`
          <div style="background:rgba(239,68,68,.05);border:1px dashed rgba(239,68,68,.3);border-radius:8px;padding:20px;text-align:center;margin-bottom:12px">
            <div style="font-size:13px;color:var(--text2);margin-bottom:12px">Nenhum número conectado</div>
            <button class="btn btn-primary btn-sm" onclick="editarWA('${c.id}','')">📱 Configurar WhatsApp</button>
          </div>
        `}
      </div>`).join('');
  }catch(e){ list.innerHTML = '<div class="empty-state"><p style="color:var(--red)">Erro: '+e.message+'</p></div>'; }
}

function editarWA(id, phoneId){
  const novoId = prompt('Digite o Phone Number ID da Meta:', phoneId||'');
  if(novoId===null) return;
  api(`tenants?id=eq.${id}`,'PATCH',{whatsapp_phone_id:novoId||null})
    .then(() => { toast('WhatsApp atualizado!'); loadWA(); })
    .catch(e => toast('Erro: '+e.message,'error'));
}

function desconectarWA(id){
  if(!confirm('Desconectar WhatsApp desta clínica?')) return;
  api(`tenants?id=eq.${id}`,'PATCH',{whatsapp_phone_id:null})
    .then(() => { toast('WhatsApp desconectado'); loadWA(); })
    .catch(e => toast('Erro: '+e.message,'error'));
}

async function loadConfigSelect(){
  try{
    const t = await api('tenants?select=id,nome,slug&order=nome');
    clinicasData = t;
    updateSelects(t);
  }catch(e){}
}

async function loadConfig(){
  const id = document.getElementById('config-clinica-select').value;
  if(!id){ document.getElementById('config-content').style.display='none'; document.getElementById('config-empty').style.display='block'; return; }
  document.getElementById('config-content').style.display = 'block';
  document.getElementById('config-empty').style.display = 'none';
  try{
    const r = await api('tenants?id=eq.'+id+'&select=*');
    const c = r[0];
    document.getElementById('cfg-nome').value = c.nome||'';
    document.getElementById('cfg-plano').value = c.plano||'basic';
    document.getElementById('cfg-creditos').value = c.credito_mensal||2000;
    document.getElementById('cfg-phone-id').value = c.whatsapp_phone_id||'';
    document.getElementById('cfg-numero-notif').value = c.numero_notificacao||'';
    document.getElementById('cfg-ativo').value = String(c.ativo!==false);
    document.getElementById('cfg-email').value = c.email||'';
    document.getElementById('cfg-senha').value = c.senha||'';
    // System prompt vem diretamente do campo system_prompt do tenant
    document.getElementById('prompt-text').value = c.system_prompt||'';
    loadFaq(id);
  }catch(e){ toast('Erro ao carregar config: '+e.message,'error'); }
}

async function savePrompt(){
  const id = document.getElementById('config-clinica-select').value;
  const conteudo = document.getElementById('prompt-text').value.trim();
  if(!id||!conteudo){ toast('Selecione uma clínica e preencha o prompt','error'); return; }
  try{
    // Salva diretamente no campo system_prompt do tenant
    await api(`tenants?id=eq.${id}`,'PATCH',{system_prompt:conteudo});
    toast('Prompt salvo com sucesso!');
  }catch(e){ toast('Erro: '+e.message,'error'); }
}

async function saveDados(){
  const id = document.getElementById('config-clinica-select').value;
  if(!id){ toast('Selecione uma clínica','error'); return; }
  try{
    await api(`tenants?id=eq.${id}`,'PATCH',{
      nome: document.getElementById('cfg-nome').value,
      plano: document.getElementById('cfg-plano').value,
      credito_mensal: parseInt(document.getElementById('cfg-creditos').value),
      whatsapp_phone_id: document.getElementById('cfg-phone-id').value||null,
      numero_notificacao: document.getElementById('cfg-numero-notif').value||null,
      ativo: document.getElementById('cfg-ativo').value==='true',
      email: document.getElementById('cfg-email').value||null,
      senha: document.getElementById('cfg-senha').value||null
    });
    toast('Dados salvos!');
    loadClinicas();
  }catch(e){ toast('Erro: '+e.message,'error'); }
}

let faqData = [];
async function loadFaq(id){
  if(!id) id = document.getElementById('config-clinica-select').value;
  const list = document.getElementById('faq-list');
  try{
    const f = await api(`knowledge_base?tenant_id=eq.${id}&order=created_at`);
    faqData = f;
    if(!f.length){ list.innerHTML = '<div class="empty-state"><p>Nenhuma pergunta cadastrada</p></div>'; return; }
    list.innerHTML = f.map(q => `
      <div class="faq-item">
        <div style="font-size:13px;font-weight:500;margin-bottom:4px">${q.pergunta}</div>
        <div style="font-size:12px;color:var(--text3);line-height:1.5">${q.resposta}</div>
        <div style="display:flex;gap:6px;margin-top:10px">
          <button class="btn btn-ghost btn-sm" onclick="editFaq('${q.id}')">✏️ Editar</button>
          <button class="btn btn-danger btn-sm" onclick="deleteFaq('${q.id}')">🗑️</button>
        </div>
      </div>`).join('');
  }catch(e){ list.innerHTML = '<div class="empty-state"><p style="color:var(--red)">Erro: '+e.message+'</p></div>'; }
}

function editFaq(id){
  const f = faqData.find(x=>x.id==id);
  if(!f) return;
  document.getElementById('faq-id').value = f.id;
  document.getElementById('faq-pergunta').value = f.pergunta;
  document.getElementById('faq-resposta').value = f.resposta;
  document.getElementById('faq-modal-title').textContent = 'Editar pergunta';
  openModal('modal-nova-faq');
}

async function salvarFaq(){
  const id = document.getElementById('config-clinica-select').value;
  const faqId = document.getElementById('faq-id').value;
  const pergunta = document.getElementById('faq-pergunta').value.trim();
  const resposta = document.getElementById('faq-resposta').value.trim();
  if(!pergunta||!resposta){ toast('Preencha a pergunta e resposta','error'); return; }
  try{
    if(faqId){
      await api(`knowledge_base?id=eq.${faqId}`,'PATCH',{pergunta,resposta});
    } else {
      await api('knowledge_base','POST',{tenant_id:id,pergunta,resposta});
    }
    closeModal('modal-nova-faq');
    toast('FAQ salvo!');
    document.getElementById('faq-id').value='';
    document.getElementById('faq-pergunta').value='';
    document.getElementById('faq-resposta').value='';
    document.getElementById('faq-modal-title').textContent='Nova pergunta';
    loadFaq(id);
  }catch(e){ toast('Erro: '+e.message,'error'); }
}

async function deleteFaq(id){
  if(!confirm('Excluir esta pergunta?')) return;
  try{
    await api(`knowledge_base?id=eq.${id}`,'DELETE');
    toast('FAQ excluído!');
    loadFaq();
  }catch(e){ toast('Erro: '+e.message,'error'); }
}

function switchTab(el, tabId){
  document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  ['cfg-prompt','cfg-faq','cfg-dados'].forEach(id => {
    document.getElementById(id).style.display = id===tabId?'block':'none';
  });
  if(tabId==='cfg-faq') loadFaq();
}

function irConfig(id){
  showSection('config', document.querySelectorAll('.nav-item')[5]);
  setTimeout(()=>{
    document.getElementById('config-clinica-select').value = id;
    loadConfig();
  },100);
}

// ── MÉDICOS ───────────────────────────────────────────────────────────────────
let medicosData = [];

async function loadMedicos(){
  const clinicaId = document.getElementById('medicos-clinica-select').value;
  const tb = document.getElementById('medicos-table');
  if(!clinicaId){
    tb.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:20px">Selecione uma clínica</td></tr>';
    return;
  }
  tb.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:20px">Carregando...</td></tr>';
  try{
    const m = await api(`medicos?tenant_id=eq.${clinicaId}&select=*&order=nome`);
    medicosData = m || [];
    if(!m || m.length === 0){
      tb.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:20px">Nenhum médico cadastrado</td></tr>';
      return;
    }
    tb.innerHTML = m.map(med => `
      <tr>
        <td class="name">${med.nome}</td>
        <td>${med.especialidade||'—'}</td>
        <td style="font-size:11px;font-family:monospace;color:var(--text3)">${med.calendar_id ? med.calendar_id.substring(0,30)+'...' : '—'}</td>
        <td><span class="badge ${med.ativo?'badge-green':'badge-red'}">${med.ativo?'Ativo':'Inativo'}</span></td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn btn-ghost btn-sm" onclick="editarMedico('${med.id}')">✏️</button>
            <button class="btn btn-danger btn-sm" onclick="deletarMedico('${med.id}')">🗑️</button>
          </div>
        </td>
      </tr>`).join('');
  }catch(e){ tb.innerHTML = '<tr><td colspan="5" style="color:var(--red);padding:20px">Erro: '+e.message+'</td></tr>'; }
}

function editarMedico(id){
  const m = medicosData.find(x => x.id === id);
  if(!m) return;
  document.getElementById('medico-id').value = m.id;
  document.getElementById('medico-nome').value = m.nome||'';
  document.getElementById('medico-especialidade').value = m.especialidade||'';
  document.getElementById('medico-calendar-id').value = m.calendar_id||'';
  document.getElementById('medico-ativo').value = String(m.ativo !== false);
  document.getElementById('medico-modal-title').textContent = 'Editar médico';
  openModal('modal-novo-medico');
}

async function salvarMedico(){
  const clinicaId = document.getElementById('medicos-clinica-select').value;
  const medicoId = document.getElementById('medico-id').value;
  const nome = document.getElementById('medico-nome').value.trim();
  if(!nome){ toast('Nome é obrigatório','error'); return; }
  if(!clinicaId){ toast('Selecione uma clínica','error'); return; }

  const payload = {
    tenant_id: clinicaId,
    nome,
    especialidade: document.getElementById('medico-especialidade').value||null,
    calendar_id: document.getElementById('medico-calendar-id').value||null,
    ativo: document.getElementById('medico-ativo').value === 'true'
  };

  try{
    if(medicoId){
      await api(`medicos?id=eq.${medicoId}`,'PATCH', payload);
    } else {
      await api('medicos','POST', payload);
    }
    closeModal('modal-novo-medico');
    toast('Médico salvo com sucesso!');
    document.getElementById('medico-id').value = '';
    document.getElementById('medico-nome').value = '';
    document.getElementById('medico-especialidade').value = '';
    document.getElementById('medico-calendar-id').value = '';
    document.getElementById('medico-modal-title').textContent = 'Novo médico';
    loadMedicos();
  }catch(e){ toast('Erro: '+e.message,'error'); }
}

async function deletarMedico(id){
  if(!confirm('Excluir este médico?')) return;
  try{
    await api(`medicos?id=eq.${id}`,'DELETE');
    toast('Médico excluído!');
    loadMedicos();
  }catch(e){ toast('Erro: '+e.message,'error'); }
}

// Init
window.onerror = function(msg, src, line){ console.error('ERRO GLOBAL:', msg, 'linha:', line); };
loadDashboard();
</script>
</body>
</html>
