const http = require('http');
const https = require('https');
const url = require('url');
const { verificarDisponibilidade, criarAgendamento } = require('./google-calendar');
// SaasIA Voice Server v1.5 - 2026-06-29 - Google Calendar integrado

const OPENAI_KEY        = process.env.OPENAI_KEY;
const META_TOKEN        = process.env.META_TOKEN;
const SUPABASE_KEY      = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjYmFvc2RienFuaGZhYnNqbW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1Mzc4NDgsImV4cCI6MjA5NTExMzg0OH0.D28TDbco_WbraWAVpQwFy8LF02cj2VO1Cz_zsQy1BQA';
const BASE_URL          = process.env.BASE_URL || 'https://determined-generosity-production-96e4.up.railway.app';
const WHATSAPP_PHONE_ID = '1237032046153902';

const voiceConversations = {};
let cachedTenant = null;

// ─── Supabase ─────────────────────────────────────────────────────────────────
function supabaseRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Prefer': 'return=minimal'
    };
    if (bodyStr) headers['Content-Length'] = Buffer.byteLength(bodyStr);
    const req = https.request({
      hostname: 'ecbaosdbzqnhfabsjmng.supabase.co',
      path: '/rest/v1/' + path,
      method, headers
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(d ? JSON.parse(d) : null); } catch(e) { resolve(null); } });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function loadTenant() {
  try {
    const tenants = await supabaseRequest('tenants?select=*&slug=eq.bella');
    if (tenants && Array.isArray(tenants) && tenants.length > 0) {
      cachedTenant = tenants[0];
      console.log('Tenant carregado:', cachedTenant.nome);
    } else {
      cachedTenant = {
        nome: 'Clínica Bella Estética',
        system_prompt: 'Você é Sofia, recepcionista da Clínica Bella Estética. Seja simpática e profissional.',
        endereco: 'Av. 85, 1385 - Setor Marista, Goiânia-GO'
      };
      console.log('Usando fallback para tenant bella');
    }
  } catch(e) {
    cachedTenant = {
      nome: 'Clínica Bella Estética',
      system_prompt: 'Você é Sofia, recepcionista da Clínica Bella Estética. Seja simpática e profissional.',
      endereco: 'Av. 85, 1385 - Setor Marista, Goiânia-GO'
    };
    console.log('Erro ao carregar tenant, usando fallback:', e.message);
  }
}

// ─── WhatsApp via Meta API ────────────────────────────────────────────────────
function enviarWhatsApp(para, mensagem) {
  if (!META_TOKEN) { console.log('META_TOKEN não configurado'); return; }
  const numeroLimpo = para.replace(/\D/g, '');
  const body = JSON.stringify({
    messaging_product: 'whatsapp',
    to: numeroLimpo,
    type: 'text',
    text: { body: mensagem }
  });
  const req = https.request({
    hostname: 'graph.facebook.com',
    path: '/v19.0/' + WHATSAPP_PHONE_ID + '/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + META_TOKEN,
      'Content-Length': Buffer.byteLength(body)
    }
  }, res => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => console.log('WhatsApp enviado:', res.statusCode, d));
  });
  req.on('error', e => console.log('Erro WhatsApp:', e.message));
  req.write(body);
  req.end();
}

function pedidoLocalizacao(texto) {
  const t = texto.toLowerCase();
  return t.includes('localiza') || t.includes('endere') || t.includes('onde fica') ||
         t.includes('como chegar') || t.includes('manda') || t.includes('envia') ||
         t.includes('whatsapp') || t.includes('maps') || t.includes('mapa');
}

// ─── OpenAI com Function Calling ─────────────────────────────────────────────
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'verificar_disponibilidade',
      description: 'Verifica se um horário específico está disponível no calendário da clínica antes de confirmar um agendamento.',
      parameters: {
        type: 'object',
        properties: {
          data_hora_iso: { type: 'string', description: 'Data e hora no formato ISO 8601, ex: 2026-07-02T14:00:00-03:00 (horário de Brasília)' }
        },
        required: ['data_hora_iso']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'criar_agendamento',
      description: 'Cria o agendamento definitivo no calendário depois de confirmar disponibilidade e ter nome do cliente e procedimento.',
      parameters: {
        type: 'object',
        properties: {
          data_hora_iso: { type: 'string', description: 'Data e hora no formato ISO 8601, ex: 2026-07-02T14:00:00-03:00' },
          nome_cliente: { type: 'string' },
          procedimento: { type: 'string' }
        },
        required: ['data_hora_iso', 'nome_cliente', 'procedimento']
      }
    }
  }
];

async function executarFuncao(nome, args, telefone) {
  console.log('Executando função:', nome, JSON.stringify(args));
  if (nome === 'verificar_disponibilidade') {
    const r = await verificarDisponibilidade(args.data_hora_iso);
    if (r.erro) return JSON.stringify({ disponivel: false, mensagem: 'Erro ao consultar agenda' });
    return JSON.stringify({ disponivel: r.disponivel });
  }
  if (nome === 'criar_agendamento') {
    const r = await criarAgendamento({
      dataISO: args.data_hora_iso,
      nomeCliente: args.nome_cliente,
      procedimento: args.procedimento,
      telefone
    });
    return JSON.stringify({ sucesso: r.sucesso });
  }
  return JSON.stringify({ erro: 'função desconhecida' });
}

async function chatGPT(systemPrompt, history, userMsg, telefone) {
  let messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMsg }
  ];

  for (let i = 0; i < 4; i++) {
    const result = await chamarOpenAI(messages, TOOLS);
    if (!result) return 'Pode repetir, por favor?';

    if (result.tool_calls && result.tool_calls.length > 0) {
      messages.push({ role: 'assistant', content: result.content || null, tool_calls: result.tool_calls });
      for (const tc of result.tool_calls) {
        const args = JSON.parse(tc.function.arguments);
        const resultado = await executarFuncao(tc.function.name, args, telefone);
        messages.push({ role: 'tool', tool_call_id: tc.id, content: resultado });
      }
      continue;
    }

    return result.content || 'Desculpe, pode repetir?';
  }
  return 'Desculpe, tive um problema. Pode repetir?';
}

function chamarOpenAI(messages, tools) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ model: 'gpt-4o', messages, tools, max_tokens: 150 });
    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + OPENAI_KEY,
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(d);
          resolve(json.choices[0].message);
        } catch(e) { console.log('Erro parse OpenAI:', e.message, d); resolve(null); }
      });
    });
    req.on('error', e => { console.log('Erro OpenAI:', e.message); resolve(null); });
    req.write(body);
    req.end();
  });
}

// ─── TwiML helpers ────────────────────────────────────────────────────────────
function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function twimlGather(text, gatherAction) {
  return '<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  <Gather input="speech" action="' + gatherAction + '" method="POST" language="pt-BR" speechTimeout="auto" speechModel="googlev2_telephony" timeout="8" profanityFilter="false">\n    <Say language="pt-BR" voice="Polly.Vitoria-Neural">' + escapeXml(text) + '</Say>\n  </Gather>\n  <Redirect method="POST">' + gatherAction + '</Redirect>\n</Response>';
}

function twimlHangup(text) {
  return '<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  <Say language="pt-BR" voice="Polly.Vitoria-Neural">' + escapeXml(text) + '</Say>\n  <Hangup/>\n</Response>';
}

// ─── Handlers ─────────────────────────────────────────────────────────────────
function getSaudacaoHorario() {
  const agoraUTC = new Date();
  const agoraBrasilia = new Date(agoraUTC.getTime() - 3 * 3600000);
  const horaBrasilia = agoraBrasilia.getUTCHours();
  const dataBrasiliaStr = agoraBrasilia.toISOString().slice(0, 10);
  const saudacao = horaBrasilia >= 6 && horaBrasilia < 12 ? 'Bom dia'
    : horaBrasilia >= 12 && horaBrasilia < 18 ? 'Boa tarde'
    : 'Boa noite';
  return { horaBrasilia, dataBrasiliaStr, saudacao };
}

function handleIncomingCall(callSid, from) {
  console.log('Nova ligação:', callSid, 'de:', from);
  const tenant = cachedTenant;
  const { horaBrasilia, saudacao } = getSaudacaoHorario();
  console.log('Saudação inicial calculada - hora Brasília:', horaBrasilia, '- saudação:', saudacao);
  const saudacaoCompleta = tenant
    ? tenant.nome + ', ' + saudacao.toLowerCase() + '! Sou a Sofia. Como posso ajudar?'
    : saudacao + '! Aqui é a Sofia. Como posso ajudar?';
  console.log('Texto completo da saudação:', saudacaoCompleta);
  voiceConversations[callSid] = { history: [], tenant, from };
  return twimlGather(saudacaoCompleta, BASE_URL + '/voice/gather?callSid=' + callSid);
}

async function handleGather(callSid, speechResult) {
  console.log('Gather - CallSid:', callSid, 'Speech:', speechResult);

  const conv = voiceConversations[callSid];
  if (!conv) return twimlHangup('Desculpe, houve um erro. Por favor, ligue novamente.');

  if (!speechResult || speechResult.trim() === '') {
    conv.falhasConsecutivas = (conv.falhasConsecutivas || 0) + 1;
    if (conv.falhasConsecutivas >= 3) {
      delete voiceConversations[callSid];
      return twimlHangup('Desculpe, não estou conseguindo te ouvir bem. Por favor, ligue novamente de um lugar mais silencioso.');
    }
    return twimlGather('Não ouvi. Pode repetir?', BASE_URL + '/voice/gather?callSid=' + callSid);
  }

  // Transcrição suspeita: muito curta (1 palavra isolada e sem sentido) repetidamente sugere ruído/confusão
  const palavras = speechResult.trim().split(/\s+/);
  if (palavras.length === 1 && palavras[0].length <= 3) {
    conv.falhasConsecutivas = (conv.falhasConsecutivas || 0) + 1;
    if (conv.falhasConsecutivas >= 3) {
      delete voiceConversations[callSid];
      return twimlHangup('Desculpe, não estou conseguindo entender bem. Por favor, ligue novamente em um ambiente mais silencioso.');
    }
    return twimlGather('Desculpa, não entendi bem. Só você pode falar novamente, por favor?', BASE_URL + '/voice/gather?callSid=' + callSid);
  }
  conv.falhasConsecutivas = 0;

  conv.history.push({ role: 'user', content: speechResult });

  // Horário e data atual de Brasília (UTC-3)
  const { horaBrasilia, dataBrasiliaStr, saudacao: saudacaoHorario } = getSaudacaoHorario();

  const basePrompt = (conv.tenant && conv.tenant.system_prompt)
    ? conv.tenant.system_prompt
    : 'Você é Sofia, recepcionista virtual de uma clínica estética. Seja simpática e profissional.';

  const systemPrompt = basePrompt +
    '\n\nDATA E HORÁRIO ATUAL: ' + dataBrasiliaStr + ', ' + horaBrasilia + 'h (horário de Brasília).' +
    '\n\nREGRA DE SAUDAÇÃO (MUITO IMPORTANTE): NÃO diga "bom dia", "boa tarde" ou "boa noite" nesta resposta, EM NENHUMA HIPÓTESE, mesmo que o cliente tenha dito isso na fala dele. A saudação inicial já foi feita no início da ligação. Responda direto ao que o cliente disse, sem repetir nenhuma saudação.' +
    '\n\nFERRAMENTAS DE AGENDAMENTO: Você tem acesso a verificar_disponibilidade e criar_agendamento. SEMPRE verifique disponibilidade antes de confirmar um horário. Calcule a data ISO a partir da data de hoje (' + dataBrasiliaStr + ') e do que o cliente pedir (ex: "quinta-feira às 14h"). Só chame criar_agendamento depois de ter nome do cliente, procedimento e confirmação de disponibilidade.' +
    '\n\nREGRAS DE VOZ: Máximo 2 frases curtas por resposta. Sem emojis. Use o nome do cliente no máximo UMA VEZ em toda a conversa. Se não entendeu, pergunte de novo de forma natural.' +
    '\n\nAMBIENTE RUIDOSO: Você está recebendo a transcrição de uma ligação telefônica, que pode ter ruído de fundo, vozes sobrepostas ou interferência. Se a transcrição parecer incompleta, sem sentido, misturar assuntos diferentes, ou parecer ter mais de uma pessoa falando ao mesmo tempo, NÃO tente adivinhar a intenção — responda de forma natural pedindo para repetir, como: "Desculpa, não consegui entender bem, pode repetir?" ou "Só você pode falar, por favor? Não consegui entender." Nunca assuma informações que não ficaram claras na fala.';

  console.log('Chamando GPT... hora Brasília:', horaBrasilia, saudacaoHorario, 'data:', dataBrasiliaStr);
  const reply = await chatGPT(systemPrompt, conv.history.slice(-8), speechResult, conv.from);
  console.log('AI reply:', reply);
  conv.history.push({ role: 'assistant', content: reply });

  // Envia localização por WhatsApp se cliente pediu
  if (pedidoLocalizacao(speechResult) && conv.from) {
    const endereco = (conv.tenant && conv.tenant.endereco) ? conv.tenant.endereco : 'Av. 85, 1385 - Setor Marista, Goiânia-GO';
    const nomeTenant = (conv.tenant && conv.tenant.nome) ? conv.tenant.nome : 'Clínica Bella Estética';
    const mapsLink = 'https://maps.google.com/?q=' + encodeURIComponent(endereco);
    enviarWhatsApp(conv.from, '📍 ' + nomeTenant + '\n' + endereco + '\n' + mapsLink);
    console.log('Localização enviada por WhatsApp para', conv.from);
  }

  // Detecta transferência para humano
  if (reply.includes('[TRANSFERIR_HUMANO]')) {
    console.log('Transferindo para humano:', callSid);
    delete voiceConversations[callSid];
    return twimlHangup('Vou transferir você para um de nossos atendentes. Um momento, por favor. Até logo!');
  }

  const replyVoz = reply.replace(/[\u{1F000}-\u{1FFFF}]/gu, '').replace(/[\u{2600}-\u{27FF}]/gu, '').trim();

  const palavrasEncerrar = ['tchau', 'até mais', 'até logo'];
  const deveEncerrar = palavrasEncerrar.some(p => replyVoz.toLowerCase().includes(p)) && conv.history.length > 4;

  if (deveEncerrar) {
    delete voiceConversations[callSid];
    return twimlHangup(replyVoz);
  }

  return twimlGather(replyVoz, BASE_URL + '/voice/gather?callSid=' + callSid);
}

// ─── Servidor HTTP ────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;
  let body = '';
  req.on('data', c => body += c);
  req.on('end', async () => {
    const params = {};
    body.split('&').forEach(p => {
      const [k, v] = p.split('=');
      if (k) params[decodeURIComponent(k)] = decodeURIComponent((v || '').replace(/\+/g, ' '));
    });
    res.setHeader('Content-Type', 'text/xml');
    try {
      if (pathname === '/voice/incoming') {
        console.log('Req: POST /voice/incoming de:', params.From);
        const twiml = handleIncomingCall(params.CallSid, params.From);
        res.writeHead(200);
        res.end(twiml);
      } else if (pathname === '/voice/gather') {
        console.log('Req: POST /voice/gather');
        const callSid = parsed.query.callSid || params.CallSid;
        const twiml = await handleGather(callSid, params.SpeechResult || '');
        res.writeHead(200);
        res.end(twiml);
      } else if (pathname === '/voice/status') {
        if (params.CallStatus === 'completed') {
          delete voiceConversations[params.CallSid];
          console.log('Chamada encerrada:', params.CallSid);
        }
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('SaasIA Voice Server v1.5 OK');
      }
    } catch(e) {
      console.log('Erro:', e.message, e.stack);
      res.writeHead(200);
      res.end('<?xml version="1.0" encoding="UTF-8"?><Response><Say language="pt-BR" voice="Polly.Vitoria-Neural">Desculpe, ocorreu um erro.</Say><Hangup/></Response>');
    }
  });
});

loadTenant().then(() => {
  server.listen(process.env.PORT || 3003, '0.0.0.0', () => {
    console.log('Voice Server v1.5 na porta', process.env.PORT || 3003);
    console.log('OPENAI_KEY:', !!OPENAI_KEY);
    console.log('META_TOKEN:', !!META_TOKEN);
    console.log('GOOGLE_CLIENT_EMAIL:', !!process.env.GOOGLE_CLIENT_EMAIL);
    console.log('GOOGLE_PRIVATE_KEY:', !!process.env.GOOGLE_PRIVATE_KEY);
    console.log('BASE_URL:', BASE_URL);
    console.log('Pronto!');
  });
});
