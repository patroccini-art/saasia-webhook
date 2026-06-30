const http = require('http');
const https = require('https');
const url = require('url');
// SaasIA Voice Server v1.0 - 2026-06-29

// ─── Configurações ────────────────────────────────────────────────────────────
const TWILIO_ACCOUNT_SID = 'ACee9df8f72d3c80437f69786394e477c8';
const TWILIO_AUTH_TOKEN = 'ea7421c14a7004576983512d7e9d921d';
const TWILIO_NUMBER = '+18443147061';
const OPENAI_KEY = process.env.OPENAI_KEY;
const ELEVENLABS_KEY = 'sk_34af32768890eea8972e45007a3766dcb6aa81767d9d85a7';
const ELEVENLABS_VOICE_ID = 'mPDAoQyGzxBSkE0OAOKw';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjYmFvc2RienFuaGZhYnNqbW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1Mzc4NDgsImV4cCI6MjA5NTExMzg0OH0.D28TDbco_WbraWAVpQwFy8LF02cj2VO1Cz_zsQy1BQA';

// Mapa de conversas de voz em memória
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
  const tenants = await supabaseRequest(`tenants?select=*`);
  if (!tenants || !Array.isArray(tenants)) return null;
  // Por enquanto retorna o primeiro tenant ativo (bella)
  // Futuramente filtrar por número Twilio cadastrado
  return tenants.find(t => t.ativo !== false) || null;
}

// ─── OpenAI ───────────────────────────────────────────────────────────────────
async function chatGPT(systemPrompt, history, userMsg) {
  const messages = [
    { role: 'system', content: systemPrompt + '\n\nVocê está em uma LIGAÇÃO DE VOZ. Seja MUITO breve e direta. Máximo 2 frases por resposta. Fale de forma natural como em uma ligação telefônica.' },
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

// ─── ElevenLabs TTS ───────────────────────────────────────────────────────────
async function textToSpeech(text) {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.8, speed: 1.1 }
    });

    const req = https.request({
      hostname: 'api.elevenlabs.io',
      path: `/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_KEY,
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        if(res.statusCode === 200) {
          const audioBuffer = Buffer.concat(chunks);
          resolve(audioBuffer.toString('base64'));
        } else {
          console.log('ElevenLabs error:', res.statusCode);
          resolve(null);
        }
      });
    });
    req.on('error', e => { console.log('ElevenLabs error:', e.message); resolve(null); });
    req.write(body);
    req.end();
  });
}

// ─── Gera TwiML com áudio ────────────────────────────────────────────────────
function twimlSay(text, gatherAction) {
  // Usa <Say> com Polly para português enquanto não temos URL de áudio hospedada
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${gatherAction}" method="POST" language="pt-BR" speechTimeout="2" timeout="5">
    <Say language="pt-BR" voice="Polly.Vitoria-Neural">${text}</Say>
  </Gather>
  <Redirect method="POST">${gatherAction}</Redirect>
</Response>`;
}

function twimlHangup(text) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="pt-BR" voice="Polly.Vitoria-Neural">${text}</Say>
  <Hangup/>
</Response>`;
}

// ─── Handlers ─────────────────────────────────────────────────────────────────
async function handleIncomingCall(callSid, from, to) {
  console.log('Nova ligação:', callSid, 'de:', from, 'para:', to);

  const tenant = await getTenantByTwilioNumber(to);
  const saudacao = tenant
    ? `Olá! Bem-vindo à ${tenant.nome}. Sou a Sofia, assistente virtual. Como posso ajudar?`
    : 'Olá! Como posso ajudar?';

  // Inicia histórico da conversa
  voiceConversations[callSid] = {
    history: [],
    tenant,
    from
  };

  return twimlSay(saudacao, `/voice/gather?callSid=${callSid}`);
}

async function handleGather(callSid, speechResult) {
  console.log('Speech:', callSid, '-', speechResult);

  const conv = voiceConversations[callSid];
  if (!conv) {
    return twimlHangup('Desculpe, houve um erro. Por favor ligue novamente.');
  }

  if (!speechResult || speechResult.trim() === '') {
    return twimlSay('Não ouvi sua resposta. Pode repetir?', `/voice/gather?callSid=${callSid}`);
  }

  // Adiciona ao histórico
  conv.history.push({ role: 'user', content: speechResult });

  // System prompt
  const systemPrompt = conv.tenant?.system_prompt ||
    'Você é Sofia, recepcionista virtual de uma clínica estética. Seja simpática e profissional.';

  // Gera resposta
  const reply = await chatGPT(systemPrompt, conv.history.slice(-6), speechResult);
  console.log('AI reply:', reply);

  // Adiciona ao histórico
  conv.history.push({ role: 'assistant', content: reply });

  // Verifica se quer encerrar
  const palavrasEncerrar = ['tchau', 'obrigado', 'obrigada', 'até mais', 'até logo', 'encerrar'];
  const quer_encerrar = palavrasEncerrar.some(p => reply.toLowerCase().includes(p) || speechResult.toLowerCase().includes(p));

  if (quer_encerrar && conv.history.length > 4) {
    delete voiceConversations[callSid];
    return twimlHangup(reply + ' Até logo!');
  }

  return twimlSay(reply, `/voice/gather?callSid=${callSid}`);
}

// ─── Servidor HTTP ────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const path = parsed.pathname;

  let body = '';
  req.on('data', c => body += c);
  req.on('end', async () => {
    // Parse form data do Twilio
    const params = {};
    body.split('&').forEach(p => {
      const [k, v] = p.split('=');
      if (k) params[decodeURIComponent(k)] = decodeURIComponent((v||'').replace(/\+/g, ' '));
    });

    res.setHeader('Content-Type', 'text/xml');

    try {
      if (path === '/voice/incoming') {
        const twiml = await handleIncomingCall(params.CallSid, params.From, params.To);
        res.writeHead(200);
        res.end(twiml);

      } else if (path === '/voice/gather') {
        const callSid = parsed.query.callSid || params.CallSid;
        const speech = params.SpeechResult || '';
        const twiml = await handleGather(callSid, speech);
        res.writeHead(200);
        res.end(twiml);

      } else if (path === '/voice/status') {
        // Callback de status da chamada
        console.log('Call status:', params.CallStatus, params.CallSid);
        if (params.CallStatus === 'completed') {
          delete voiceConversations[params.CallSid];
        }
        res.writeHead(200);
        res.end('OK');

      } else {
        res.writeHead(200);
        res.setHeader('Content-Type', 'text/plain');
        res.end('SaasIA Voice Server OK');
      }
    } catch(e) {
      console.log('Erro:', e.message);
      res.writeHead(200);
      res.end('<?xml version="1.0" encoding="UTF-8"?><Response><Say language="pt-BR">Desculpe, ocorreu um erro. Tente novamente.</Say><Hangup/></Response>');
    }
  });
});

server.listen(process.env.PORT || 3003, () => console.log('Voice Server OK na porta', process.env.PORT || 3003));
