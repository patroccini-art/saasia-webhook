const http = require('http');
const https = require('https');
const url = require('url');
// SaasIA Voice Server v1.1 - 2026-06-29
// Fix: resposta imediata ao Twilio + processamento em background

// ─── Configurações ────────────────────────────────────────────────────────────
const TWILIO_ACCOUNT_SID = 'ACee9df8f72d3c80437f69786394e477c8';
const TWILIO_AUTH_TOKEN  = 'ea7421c14a7004576983512d7e9d921d';
const TWILIO_NUMBER      = '+18443147061';
const OPENAI_KEY         = process.env.OPENAI_KEY;
const SUPABASE_KEY       = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjYmFvc2RienFuaGZhYnNqbW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1Mzc4NDgsImV4cCI6MjA5NTExMzg0OH0.D28TDbco_WbraWAVpQwFy8LF02cj2VO1Cz_zsQy1BQA';

// Estado das conversas de voz em memória
// { [callSid]: { history, tenant, from, pendingReply, status } }
// status: 'active' | 'processing' | 'ready' | 'ended'
const voiceConversations = {};

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

async function getTenantByTwilioNumber(twilioNumber) {
  const tenants = await supabaseRequest('tenants?select=*');
  if (!tenants || !Array.isArray(tenants)) return null;
  // Por enquanto só Bella tem voz configurado — usar slug como fallback fixo
  // Futuramente: adicionar coluna twilio_number na tabela tenants e filtrar por ela
  return tenants.find(t => t.slug === 'bella') || tenants.find(t => t.ativo !== false) || null;
}

// ─── OpenAI ───────────────────────────────────────────────────────────────────
async function chatGPT(systemPrompt, history, userMsg) {
  const messages = [
    {
      role: 'system',
      content: systemPrompt +
        '\n\nVocê está em uma LIGAÇÃO DE VOZ. Seja MUITO breve e direta. ' +
        'Máximo 2 frases por resposta. Fale de forma natural como em uma ligação telefônica.'
    },
    ...history,
    { role: 'user', content: userMsg }
  ];

  return new Promise((resolve) => {
    const body = JSON.stringify({ model: 'gpt-4o', messages, max_tokens: 150 });
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
        catch(e) { resolve('Desculpe, não entendi. Pode repetir?'); }
      });
    });
    req.on('error', () => resolve('Desculpe, houve um erro. Pode repetir?'));
    req.write(body);
    req.end();
  });
}

// ─── TwiML helpers ────────────────────────────────────────────────────────────
function twimlGather(text, gatherAction) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${gatherAction}" method="POST" language="pt-BR" speechTimeout="2" timeout="5">
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

// Resposta de espera: fala algo enquanto processa e redireciona para /voice/wait
function twimlWait(callSid) {
  const BASE = process.env.BASE_URL || 'https://determined-generosity-production-96e4.up.railway.app';
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="pt-BR" voice="Polly.Vitoria-Neural">Um momento.</Say>
  <Pause length="1"/>
  <Redirect method="POST">${BASE}/voice/wait?callSid=${callSid}</Redirect>
</Response>`;
}

// Polling: se a resposta ainda não ficou pronta, espera mais um pouco
function twimlPoll(callSid) {
  const BASE = process.env.BASE_URL || 'https://determined-generosity-production-96e4.up.railway.app';
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Pause length="1"/>
  <Redirect method="POST">${BASE}/voice/wait?callSid=${callSid}</Redirect>
</Response>`;
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

// /voice/incoming — responde IMEDIATAMENTE, busca tenant em background
function handleIncomingCall(callSid, from, to) {
  console.log('Nova ligação:', callSid, 'de:', from, 'para:', to);

  // Inicializa conversa com saudação genérica
  voiceConversations[callSid] = {
    history: [],
    tenant:  null,
    from,
    status:  'active',
    pendingReply: null
  };

  // Busca tenant em background (não bloqueia a resposta)
  getTenantByTwilioNumber(to)
    .then(tenant => {
      if (voiceConversations[callSid]) {
        voiceConversations[callSid].tenant = tenant;
        console.log('Tenant carregado para', callSid, ':', tenant?.nome || 'nenhum');
      }
    })
    .catch(e => console.log('Erro ao buscar tenant:', e.message));

  // Saudação genérica enquanto o tenant carrega (chega antes do primeiro gather)
  const saudacao = 'Olá! Um momento, estou te conectando à nossa recepcionista Sofia.';
  const BASE = process.env.BASE_URL || 'https://determined-generosity-production-96e4.up.railway.app';
  return twimlGather(saudacao, `${BASE}/voice/gather?callSid=${callSid}`);
}

// /voice/gather — responde IMEDIATAMENTE com "aguarde", processa GPT em background
function handleGather(callSid, speechResult) {
  console.log('Gather - CallSid:', callSid, 'Speech:', speechResult);

  const conv = voiceConversations[callSid];
  if (!conv) {
    return twimlHangup('Desculpe, houve um erro. Por favor, ligue novamente.');
  }

  if (!speechResult || speechResult.trim() === '') {
    const BASE = process.env.BASE_URL || 'https://determined-generosity-production-96e4.up.railway.app';
    return twimlGather('Não ouvi sua resposta. Pode repetir?', `${BASE}/voice/gather?callSid=${callSid}`);
  }

  // Marca como processando
  conv.status = 'processing';
  conv.pendingReply = null;
  conv.history.push({ role: 'user', content: speechResult });

  // Processa GPT em background
  const systemPrompt = conv.tenant?.system_prompt ||
    'Você é Sofia, recepcionista virtual de uma clínica estética. Seja simpática e profissional.';

  chatGPT(systemPrompt, conv.history.slice(-6), speechResult)
    .then(reply => {
      console.log('AI reply para', callSid, ':', reply);
      if (voiceConversations[callSid]) {
        conv.history.push({ role: 'assistant', content: reply });
        conv.pendingReply = reply;
        conv.status = 'ready';
      }
    })
    .catch(e => {
      console.log('Erro GPT:', e.message);
      if (voiceConversations[callSid]) {
        conv.pendingReply = 'Desculpe, houve um problema. Pode repetir?';
        conv.status = 'ready';
      }
    });

  // Responde ao Twilio imediatamente com "aguarde"
  return twimlWait(callSid);
}

// /voice/wait — polling: serve resposta quando pronta, senão espera mais
function handleWait(callSid) {
  console.log('Wait poll - CallSid:', callSid);

  const conv = voiceConversations[callSid];
  if (!conv) {
    return twimlHangup('Desculpe, houve um erro. Por favor, ligue novamente.');
  }

  const BASE = process.env.BASE_URL || 'https://determined-generosity-production-96e4.up.railway.app';

  if (conv.status !== 'ready') {
    // GPT ainda processando — poll novamente em 1s
    return twimlPoll(callSid);
  }

  // Resposta pronta!
  const reply = conv.pendingReply;
  conv.status = 'active';
  conv.pendingReply = null;

  // Verifica se deve encerrar
  const palavrasEncerrar = ['tchau', 'obrigado', 'obrigada', 'até mais', 'até logo'];
  const deveEncerrar = palavrasEncerrar.some(p =>
    reply.toLowerCase().includes(p)
  ) && conv.history.length > 4;

  if (deveEncerrar) {
    delete voiceConversations[callSid];
    return twimlHangup(reply + ' Até logo!');
  }

  return twimlGather(reply, `${BASE}/voice/gather?callSid=${callSid}`);
}

// ─── Servidor HTTP ────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  console.log('Req:', req.method, req.url);
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  let body = '';
  req.on('data', c => body += c);
  req.on('end', () => {
    // Parse form body do Twilio
    const params = {};
    body.split('&').forEach(p => {
      const [k, v] = p.split('=');
      if (k) params[decodeURIComponent(k)] = decodeURIComponent((v || '').replace(/\+/g, ' '));
    });

    res.setHeader('Content-Type', 'text/xml');

    try {
      if (pathname === '/voice/incoming') {
        const twiml = handleIncomingCall(
          params.CallSid,
          params.From,
          params.To
        );
        res.writeHead(200);
        res.end(twiml);

      } else if (pathname === '/voice/gather') {
        const callSid = parsed.query.callSid || params.CallSid;
        const twiml = handleGather(callSid, params.SpeechResult || '');
        res.writeHead(200);
        res.end(twiml);

      } else if (pathname === '/voice/wait') {
        const callSid = parsed.query.callSid || params.CallSid;
        const twiml = handleWait(callSid);
        res.writeHead(200);
        res.end(twiml);

      } else if (pathname === '/voice/status') {
        console.log('Call status:', params.CallStatus, params.CallSid);
        if (params.CallStatus === 'completed') {
          delete voiceConversations[params.CallSid];
          console.log('Conversa encerrada:', params.CallSid);
        }
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');

      } else {
        res.writeHead(200);
        res.setHeader('Content-Type', 'text/plain');
        res.end('SaasIA Voice Server v1.1 OK');
      }
    } catch(e) {
      console.log('Erro no handler:', e.message, e.stack);
      res.writeHead(200);
      res.end('<?xml version="1.0" encoding="UTF-8"?><Response><Say language="pt-BR" voice="Polly.Vitoria-Neural">Desculpe, ocorreu um erro. Por favor, ligue novamente.</Say><Hangup/></Response>');
    }
  });
});

server.listen(process.env.PORT || 3003, '0.0.0.0', () => {
  console.log('Voice Server v1.1 na porta', process.env.PORT || 3003);
  console.log('OPENAI_KEY configurada:', !!OPENAI_KEY);
  console.log('BASE_URL:', process.env.BASE_URL || 'https://determined-generosity-production-96e4.up.railway.app');
  console.log('Pronto para receber chamadas!');
});
