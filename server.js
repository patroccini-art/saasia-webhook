const http = require('http');
const https = require('https');
const url = require('url');

const VERIFY_TOKEN = 'saasia2025';
const OPENAI_KEY = process.env.OPENAI_KEY;
const META_TOKEN = 'EAATgjQ0Vn1MBRZBEZB1J2eEINT6ZBZAxnrel9CCrrP2NPDG1919l0V1jMYN5YAWAASbZBTJ43YdxNEEJhMe4AubuGtqcIWtZABeBF7BBaZCsIdNmy4uLw7idbBL0zQkiWgGgU1tBYQvOzY7pFGtKIRTCpVkdl1uJvxgJyJWxmgLmxYtfUAiIOKPMFq8RVRTM7ihnLGevzO14CyQfkaXTgUsnq1odw5ne6xZB2QeA94EzEAOOhIjT9xjYutxoqMe0jJwsSj1ITCPvhm8imZBgCmAZBCryS9anInK9pDcHW3yL8ZD';
const PHONE_ID = '1237032046153902';

// Memória de conversa por número de telefone
const conversations = {};
const MAX_HISTORY = 10; // máximo de mensagens por conversa
const TIMEOUT_MS = 30 * 60 * 1000; // limpa histórico após 30 min de inatividade

const SYSTEM_PROMPT = `Você é uma recepcionista virtual simpática e profissional de uma clínica estética.
Seu nome é Sofia.
Você ajuda clientes com informações sobre serviços, agendamentos e dúvidas gerais.
Mantenha o contexto da conversa e nunca se apresente novamente se já tiver cumprimentado o cliente.
Seja objetiva e direta nas respostas. Evite textos muito longos.
Sempre lembre do que foi dito anteriormente na conversa.`;

function getHistory(phone) {
  const now = Date.now();
  if (!conversations[phone]) {
    conversations[phone] = { messages: [], lastActivity: now };
  }
  // Limpa histórico se inativo por mais de 30 min
  if (now - conversations[phone].lastActivity > TIMEOUT_MS) {
    console.log(`Limpando histórico de ${phone} por inatividade`);
    conversations[phone].messages = [];
  }
  conversations[phone].lastActivity = now;
  return conversations[phone].messages;
}

function addToHistory(phone, role, content) {
  const history = getHistory(phone);
  history.push({ role, content });
  // Mantém só as últimas MAX_HISTORY mensagens
  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }
}

function callOpenAI(phone, userMsg, cb) {
  console.log('Calling OpenAI with key:', OPENAI_KEY ? OPENAI_KEY.substring(0, 20) + '...' : 'UNDEFINED');

  // Adiciona mensagem do usuário ao histórico
  addToHistory(phone, 'user', userMsg);

  const history = getHistory(phone);
  console.log(`Histórico de ${phone}: ${history.length} mensagens`);

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history
  ];

  const body = JSON.stringify({
    model: 'gpt-4o',
    messages,
    max_tokens: 300
  });

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
      console.log('OpenAI raw response:', d);
      try {
        const reply = JSON.parse(d).choices[0].message.content;
        // Adiciona resposta da IA ao histórico
        addToHistory(phone, 'assistant', reply);
        cb(reply);
      } catch (e) {
        console.log('OpenAI parse error:', e.message);
        cb('Desculpe, erro interno.');
      }
    });
  });

  req.on('error', e => {
    console.log('OpenAI request error:', e.message);
    cb('Erro de conexão.');
  });

  req.write(body);
  req.end();
}

function sendWhatsApp(to, text) {
  const body = JSON.stringify({
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text }
  });

  const req = https.request({
    hostname: 'graph.facebook.com',
    path: '/v18.0/' + PHONE_ID + '/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + META_TOKEN,
      'Content-Length': Buffer.byteLength(body)
    }
  }, res => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => console.log('WhatsApp response:', d));
  });

  req.write(body);
  req.end();
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);

  if (req.method === 'GET') {
    const { ['hub.mode']: mode, ['hub.verify_token']: token, ['hub.challenge']: challenge } = parsed.query;
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      res.writeHead(200);
      res.end(challenge);
    } else {
      res.writeHead(403);
      res.end('Forbidden');
    }
  } else if (req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      res.writeHead(200);
      res.end('OK');
      try {
        const data = JSON.parse(body);
        const msg = data?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
        if (msg && msg.type === 'text') {
          const phone = msg.from;
          const text = msg.text.body;
          console.log('Message from:', phone, 'Text:', text);
          callOpenAI(phone, text, reply => {
            console.log('AI reply:', reply);
            sendWhatsApp(phone, reply);
          });
        }
      } catch (e) {
        console.log('Error:', e.message);
      }
    });
  }
});

server.listen(process.env.PORT || 3002, () => console.log('Server OK'));
