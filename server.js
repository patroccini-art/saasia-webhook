const http = require('http');
const https = require('https');
const url = require('url');

const VERIFY_TOKEN = 'saasia2025';
const OPENAI_KEY = process.env.OPENAI_KEY;
const META_TOKEN = 'EAATgjQ0Vn1MBR5FGrrOrSC9ZA4eZASjMfZAastU5vyChIxBmk5YiyRsteFHrsHFJDsLPDSXwC4TgwCETZAAJyUze5btw6Cf08oqGbfuFFneMl9eH9O27NoyWBrK9aOYPWSveWocNgaoYYXH5PieMA15Ly3ns4bQURCZBojuHpbZA23LHEiefqBZBSuQNfBTdQm4pbZAMZAt9zteFZBm02QKCrVI4p1X2EWZC8nW1PZB1FP9TMxi6cV39piULHtrMIGJTOk4Jcaia5oJy7oeZBKkoeU1rDyTcsXeHWjg0SnZCp3iQZDZD';
const PHONE_ID = '1237032046153902';

const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjYmFvc2RienFuaGZhYnNqbW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1Mzc4NDgsImV4cCI6MjA5NTExMzg0OH0.D28TDbco_WbraWAVpQwFy8LF02cj2VO1Cz_zsQy1BQA';

const DEFAULT_SLUG = 'bella';
const tenantCache = {};
const CACHE_TTL = 5 * 60 * 1000;

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
      method,
      headers
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(d ? JSON.parse(d) : null); }
        catch (e) { resolve(null); }
      });
    });

    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function getTenantData(slug) {
  const now = Date.now();
  if (tenantCache[slug] && now - tenantCache[slug].ts < CACHE_TTL) {
    console.log('Usando cache para tenant:', slug);
    return tenantCache[slug].data;
  }

  console.log('Buscando dados do tenant:', slug);

  const tenants = await supabaseRequest(`tenants?slug=eq.${slug}&select=*`);
  if (!tenants || !Array.isArray(tenants) || tenants.length === 0) {
    console.log('Tenant nao encontrado:', slug);
    return null;
  }
  const tenant = tenants[0];
  console.log('Tenant encontrado:', tenant.nome);

  // System prompt vem direto do campo system_prompt na tabela tenants
  let systemPrompt = tenant.system_prompt || 'Voce e uma recepcionista virtual de clinica estetica. Seja simpatica e profissional.';

  // Busca FAQ da knowledge_base
  const faqs = await supabaseRequest(`knowledge_base?tenant_id=eq.${tenant.id}&select=pergunta,resposta`);
  const faqList = Array.isArray(faqs) ? faqs : [];
  console.log('FAQ count:', faqList.length);

  if (faqList.length > 0) {
    systemPrompt += '\n\nINFORMACOES DA CLINICA (use para responder perguntas dos clientes):\n';
    faqList.forEach(f => {
      systemPrompt += `P: ${f.pergunta}\nR: ${f.resposta}\n\n`;
    });
  }

  const data = { tenant, systemPrompt };
  tenantCache[slug] = { ts: now, data };
  return data;
}

async function getHistory(tenantId, phone) {
  const msgs = await supabaseRequest(
    `mensagens?tenant_id=eq.${tenantId}&telefone=eq.${phone}&canal=eq.whatsapp&select=role,conteudo&order=created_at.desc&limit=10`
  );
  if (!msgs || !Array.isArray(msgs) || msgs.length === 0) return [];
  return msgs.reverse().map(m => ({ role: m.role, content: m.conteudo }));
}

async function saveMessage(tenantId, phone, role, content) {
  try {
    await supabaseRequest('mensagens', 'POST', {
      tenant_id: tenantId,
      telefone: phone,
      role,
      conteudo: content,
      canal: 'whatsapp'
    });
  } catch (e) {
    console.log('Erro ao salvar mensagem:', e.message);
  }
}

function callOpenAI(systemPrompt, history, userMsg) {
  return new Promise((resolve) => {
    console.log('Calling OpenAI, historico:', history.length, 'msgs');

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: userMsg }
    ];

    const body = JSON.stringify({ model: 'gpt-4o', messages, max_tokens: 300 });

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
          const reply = JSON.parse(d).choices[0].message.content;
          resolve(reply);
        } catch (e) {
          console.log('OpenAI parse error:', e.message, d);
          resolve('Desculpe, erro interno.');
        }
      });
    });

    req.on('error', e => { console.log('OpenAI error:', e.message); resolve('Erro de conexao.'); });
    req.write(body);
    req.end();
  });
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

async function handleMessage(phone, text) {
  try {
    const tenantData = await getTenantData(DEFAULT_SLUG);
    if (!tenantData) {
      sendWhatsApp(phone, 'Servico temporariamente indisponivel.');
      return;
    }

    const { tenant, systemPrompt } = tenantData;
    const history = await getHistory(tenant.id, phone);
    console.log('Historico:', history.length, 'msgs para', phone);

    await saveMessage(tenant.id, phone, 'user', text);

    const reply = await callOpenAI(systemPrompt, history, text);
    console.log('AI reply:', reply);

    await saveMessage(tenant.id, phone, 'assistant', reply);
    sendWhatsApp(phone, reply);

  } catch (e) {
    console.log('Erro handleMessage:', e.message, e.stack);
    sendWhatsApp(phone, 'Desculpe, erro interno.');
  }
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);

  if (req.method === 'GET') {
    const { ['hub.mode']: mode, ['hub.verify_token']: token, ['hub.challenge']: challenge } = parsed.query;
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      res.writeHead(200); res.end(challenge);
    } else {
      res.writeHead(403); res.end('Forbidden');
    }
  } else if (req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      res.writeHead(200); res.end('OK');
      try {
        const data = JSON.parse(body);
        const msg = data?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
        if (msg && msg.type === 'text') {
          const phone = msg.from;
          const text = msg.text.body;
          console.log('Message from:', phone, 'Text:', text);
          handleMessage(phone, text);
        }
      } catch (e) { console.log('Error:', e.message); }
    });
  }
});

server.listen(process.env.PORT || 3002, () => console.log('Server OK'));
