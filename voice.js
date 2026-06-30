const http = require('http');
const https = require('https');
const url = require('url');
// SaasIA Voice Server v1.3 - 2026-06-29
// Fix: tenant carregado na inicialização, não por chamada

const OPENAI_KEY   = process.env.OPENAI_KEY;
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjYmFvc2RienFuaGZhYnNqbW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1Mzc4NDgsImV4cCI6MjA5NTExMzg0OH0.D28TDbco_WbraWAVpQwFy8LF02cj2VO1Cz_zsQy1BQA';
const BASE_URL     = process.env.BASE_URL || 'https://determined-generosity-production-96e4.up.railway.app';

const voiceConversations = {};

// Tenant em cache — carregado uma vez na inicialização
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
      console.log('Tenant bella não encontrado, usando fallback');
      cachedTenant = {
        nome: 'Clínica Bella Estética',
        system_prompt: 'Você é Sofia, recepcionista virtual da Clínica Bella Estética. Seja simpática e profissional.'
      };
    }
  } catch(e) {
    console.log('Erro ao carregar tenant:', e.message);
    cachedTenant = {
      nome: 'Clínica Bella Estética',
      system_prompt: 'Você é Sofia, recepcionista virtual da Clínica Bella Estética. Seja simpática e profissional.'
    };
  }
}

// ─── OpenAI ───────────────────────────────────────────────────────────────────
async function chatGPT(systemPrompt, history, userMsg) {
  const messages = [
    {
      role: 'system',
      content: systemPrompt +
        '\n\nVocê está em uma LIGAÇÃO DE VOZ. Seja MUITO breve. ' +
        'Máximo 2 frases curtas por resposta.'
    },
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
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${gatherAction}" method="POST" language="pt-BR" speechTimeout="2" timeout="8">
    <Say language="pt-BR" voice="Polly.Vitoria-Neural">${escapeXml(text)}</Say>
  </Gather>
  <Redirect method="POST">${gatherAction}</Redirect>
</Response>`;
}

function twimlHangup(text) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="pt-BR" voice="Polly.Vitoria-Neural">${escapeXml(text)}</Say>
  <Hangup/>
</Response>`;
}

// ─── Handlers ─────────────────────────────────────────────────────────────────
function handleIncomingCall(callSid, from) {
  console.log('Nova ligação:', callSid, 'de:', from);

  const tenant = cachedTenant;
  const saudacao = tenant
    ? `Olá! Bem-vinda à ${tenant.nome}. Sou a Sofia. Como posso ajudar?`
    : 'Olá! Aqui é a Sofia. Como posso ajudar?';

  voiceConversations[callSid] = { history: [], tenant, from };

  return twimlGather(saudacao, `${BASE_URL}/voice/gather?callSid=${callSid}`);
}

async function handleGather(callSid, speechResult) {
  console.log('Gather - CallSid:', callSid, 'Speech:', speechResult);

  const conv = voiceConversations[callSid];
  if (!conv) {
    return twimlHangup('Desculpe, houve um erro. Por favor, ligue novamente.');
  }

  if (!speechResult || speechResult.trim() === '') {
    return twimlGather('Não ouvi. Pode repetir?', `${BASE_URL}/voice/gather?callSid=${callSid}`);
  }

  conv.history.push({ role: 'user', content: speechResult });

  const systemPrompt = conv.tenant?.system_prompt ||
    'Você é Sofia, recepcionista virtual de uma clínica estética. Seja simpática e profissional.';

  console.log('Chamando GPT...');
  const reply = await chatGPT(systemPrompt, conv.history.slice(-6), speechResult);
  console.log('AI reply:', reply);
  conv.history.push({ role: 'assistant', content: reply });

  const palavrasEncerrar = ['tchau', 'obrigado', 'obrigada', 'até mais', 'até logo'];
  const deveEncerrar = palavrasEncerrar.some(p => reply.toLowerCase().includes(p)) && conv.history.length > 4;

  if (deveEncerrar) {
    delete voiceConversations[callSid];
    return twimlHangup(reply);
  }

  return twimlGather(reply, `${BASE_URL}/voice/gather?callSid=${callSid}`);
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
        res.end('SaasIA Voice Server v1.3 OK');
      }
    } catch(e) {
      console.log('Erro:', e.message);
      res.writeHead(200);
      res.end('<?xml version="1.0" encoding="UTF-8"?><Response><Say language="pt-BR" voice="Polly.Vitoria-Neural">Desculpe, ocorreu um erro.</Say><Hangup/></Response>');
    }
  });
});

// Carrega tenant antes de aceitar conexões
loadTenant().then(() => {
  server.listen(process.env.PORT || 3003, '0.0.0.0', () => {
    console.log('Voice Server v1.3 na porta', process.env.PORT || 3003);
    console.log('OPENAI_KEY:', !!OPENAI_KEY);
    console.log('BASE_URL:', BASE_URL);
    console.log('Pronto!');
  });
});
