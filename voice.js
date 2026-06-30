const http = require('http');
const https = require('https');
const url = require('url');
// SaasIA Voice Server v1.4 - 2026-06-29

const OPENAI_KEY       = process.env.OPENAI_KEY;
const META_TOKEN       = process.env.META_TOKEN;
const SUPABASE_KEY     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjYmFvc2RienFuaGZhYnNqbW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1Mzc4NDgsImV4cCI6MjA5NTExMzg0OH0.D28TDbco_WbraWAVpQwFy8LF02cj2VO1Cz_zsQy1BQA';
const BASE_URL         = process.env.BASE_URL || 'https://determined-generosity-production-96e4.up.railway.app';
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

// ─── OpenAI ───────────────────────────────────────────────────────────────────
async function chatGPT(systemPrompt, history, userMsg) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMsg }
  ];
  return new Promise((resolve) => {
    const body = JSON.stringify({ model: 'gpt-4o', messages, max_tokens: 100 });
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
        try { resolve(JSON.parse(d).choices[0].message.content); }
        catch(e) { resolve('Pode repetir, por favor?'); }
      });
    });
    req.on('error', () => resolve('Pode repetir, por favor?'));
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
  return '<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  <Gather input="speech" action="' + gatherAction + '" method="POST" language="pt-BR" speechTimeout="2" timeout="8">\n    <Say language="pt-BR" voice="Polly.Vitoria-Neural">' + escapeXml(text) + '</Say>\n  </Gather>\n  <Redirect method="POST">' + gatherAction + '</Redirect>\n</Response>';
}

function twimlHangup(text) {
  return '<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  <Say language="pt-BR" voice="Polly.Vitoria-Neural">' + escapeXml(text) + '</Say>\n  <Hangup/>\n</Response>';
}

// ─── Handlers ─────────────────────────────────────────────────────────────────
function handleIncomingCall(callSid, from) {
  console.log('Nova ligação:', callSid, 'de:', from);
  const tenant = cachedTenant;
  const saudacao = tenant
    ? 'Clínica ' + tenant.nome + ', boa noite! Sou a Sofia. Como posso ajudar?'
    : 'Boa noite! Aqui é a Sofia. Como posso ajudar?';
  voiceConversations[callSid] = { history: [], tenant, from };
  return twimlGather(saudacao, BASE_URL + '/voice/gather?callSid=' + callSid);
}

async function handleGather(callSid, speechResult) {
  console.log('Gather - CallSid:', callSid, 'Speech:', speechResult);

  const conv = voiceConversations[callSid];
  if (!conv) return twimlHangup('Desculpe, houve um erro. Por favor, ligue novamente.');

  if (!speechResult || speechResult.trim() === '') {
    return twimlGather('Não ouvi. Pode repetir?', BASE_URL + '/voice/gather?callSid=' + callSid);
  }

  conv.history.push({ role: 'user', content: speechResult });

  // Horário atual de Brasília (UTC-3)
  const horaBrasilia = (new Date().getUTCHours() - 3 + 24) % 24;
  const saudacaoHorario = horaBrasilia >= 6 && horaBrasilia < 12 ? 'Bom dia'
    : horaBrasilia >= 12 && horaBrasilia < 18 ? 'Boa tarde'
    : 'Boa noite';

  const basePrompt = (conv.tenant && conv.tenant.system_prompt)
    ? conv.tenant.system_prompt
    : 'Você é Sofia, recepcionista virtual de uma clínica estética. Seja simpática e profissional.';

  const systemPrompt = basePrompt + '\n\nHORÁRIO ATUAL: ' + horaBrasilia + 'h (Brasília). Saudação correta agora: "' + saudacaoHorario + '". Use OBRIGATORIAMENTE esta saudação se for a primeira interação.\n\nREGRAS DE VOZ: Máximo 2 frases curtas. Sem emojis. Use o nome do cliente no máximo UMA VEZ em toda a conversa. Se não entendeu, pergunte de novo de forma natural.';

  console.log('Chamando GPT... hora Brasília:', horaBrasilia, saudacaoHorario);
  const reply = await chatGPT(systemPrompt, conv.history.slice(-6), speechResult);
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

  // Remove emojis
  const replyVoz = reply.replace(/[\u{1F000}-\u{1FFFF}]/gu, '').replace(/[\u{2600}-\u{27FF}]/gu, '').trim();

  const palavrasEncerrar = ['tchau', 'até mais', 'até logo', 'tenha um bom', 'tenha uma boa'];
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
        res.end('SaasIA Voice Server v1.4 OK');
      }
    } catch(e) {
      console.log('Erro:', e.message);
      res.writeHead(200);
      res.end('<?xml version="1.0" encoding="UTF-8"?><Response><Say language="pt-BR" voice="Polly.Vitoria-Neural">Desculpe, ocorreu um erro.</Say><Hangup/></Response>');
    }
  });
});

loadTenant().then(() => {
  server.listen(process.env.PORT || 3003, '0.0.0.0', () => {
    console.log('Voice Server v1.4 na porta', process.env.PORT || 3003);
    console.log('OPENAI_KEY:', !!OPENAI_KEY);
    console.log('META_TOKEN:', !!META_TOKEN);
    console.log('BASE_URL:', BASE_URL);
    console.log('Pronto!');
  });
});
