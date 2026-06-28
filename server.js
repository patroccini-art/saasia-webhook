const http = require('http');
const https = require('https');
const url = require('url');
const crypto = require('crypto');

const VERIFY_TOKEN = 'saasia2025';
const OPENAI_KEY = process.env.OPENAI_KEY;
const META_TOKEN = 'EAATgjQ0Vn1MBR5FGrrOrSC9ZA4eZASjMfZAastU5vyChIxBmk5YiyRsteFHrsHFJDsLPDSXwC4TgwCETZAAJyUze5btw6Cf08oqGbfuFFneMl9eH9O27NoyWBrK9aOYPWSveWocNgaoYYXH5PieMA15Ly3ns4bQURCZBojuHpbZA23LHEiefqBZBSuQNfBTdQm4pbZAMZAt9zteFZBm02QKCrVI4p1X2EWZC8nW1PZB1FP9TMxi6cV39piULHtrMIGJTOk4Jcaia5oJy7oeZBKkoeU1rDyTcsXeHWjg0SnZCp3iQZDZD';
const PHONE_ID = '1237032046153902';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjYmFvc2RienFuaGZhYnNqbW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1Mzc4NDgsImV4cCI6MjA5NTExMzg0OH0.D28TDbco_WbraWAVpQwFy8LF02cj2VO1Cz_zsQy1BQA';
const DEFAULT_SLUG = 'bella';

const CALENDAR_ID = 'c7040a79721b2abb6d6939af11d4363fb9ea4d68741bbbda0f9187fa0f36e250@group.calendar.google.com';
const GOOGLE_SA = {
  client_email: 'saasia-calendar@gen-lang-client-0359927307.iam.gserviceaccount.com',
  private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC99CJIQHpg/2Ns\n/dSJBNPZxJoqFYSqNBIF8536fpAZzazYLIRvZ5U+NZnCaHDW+Elz7sAJnQBaEdI1\nn1UN2Gcu19Zagy1QLlQLw00QQKAaNp/wopvXmgaKPtHOCkE/DH/KahnOYOZGBcTA\n9OUtTLcbFfxGPezj2W4jRD2ezzrP5d9OO7EyQRAZrAJPSDs6Jjwy1BvIh9BXE0mz\nbFi0eWVTflj3ynfc4xeKVn9bRngsY6wDmTRUct2MoiM3j0qoPalN2qa0+ZUsdjuZ\n+2A+CG7W1WirQYtkLlXznP3UxD0p3HdY7+7fnOqp3jxUoaXxYuHvey3QvFSgtrJ9\nX6836iS1AgMBAAECggEAEBt9TR3ByUTbjcv0zRoIMhCn6mBA8il2yv0BmexIIUmd\npqBLw9Vt3d5JgUDXxLRw9UnUpfWjjuYXXa2uCcqebhkmV5S4PHLZQXAYfx02/Lh1\nSPOSl65uovCfXBBMwEegJ64y+jTUTsuOOuochU70JFgk0frOG8B9xIBn+0LJhjee\ntZ2z7BqXUELUOUBH6+wcS0DjQ22NOSs5sFnIU98ITL9l2fjj9qSh76cWynHM9Q7j\na8OpTjf/h13YSFiEGwB5/xhg3x4y1pwl85LaN+LbMw55LHqsQXTFYUhc5mMVOoDw\ngB3Yp6QBw4b0qh1393qmgMV71O97WUPqWHPpX3x0dwKBgQDsPz0AxMdw0q3DtckK\nJmPTSIOqWH3Lod6rtyESadBn7lYz3NiHyfQ7AsjjWXXtmAkGRiTw0IEaOf6zaR95\n9Re3hMeM2Ufct2kwo0wx8NTsMheXb1ohZMgLYbfN3tg6H85lhbsXvQqAxlQ/wPnC\nv+YrOLSp3twww9Dq6JwQp8jrbwKBgQDN1gGzOTe9Ct79YYSOFCig5VJSYlfZLff8\n1LmdyTods6qaQrBAVRex5FUlFl1mgxiI/iPj1WbjE9DCI8chTfA+9waxRphkH+nK\naAdDXZVSart+hVpyglzXce7aSk45DmxnBndKjYdVrHd93/dpR1cBW4i35YsNnG42\nHxZL73OwGwKBgGnYA0q+3uQLX9KZNVMY1AyrJmJBd0quYQbp6yVGxxppS7G8tj5Q\nGt39Z2eEgzNJtHFdJ9vEbrMDXLug03tedZvBH25ZQrr+aWBjKRYO4jZYUv2D5Aum\nDYIb66+Osa2I5n3RpnsCNRxwvvo5SS0ZsNOYekjJEjm+4XD9ej50Da59AoGAenYb\nltSw68DfAGMXaSxnK6qj+q3V1Dl8NCkfsdd5wxgUpSiOEghOS6EsYx9WPFo8q6yA\nD9n0F5+/cPG2VIM5L0zq52e33MH751dTEupHn7wuhsyyDjSvJeL8F1VkCqAhMH5x\nVKK1ZOxyPyqT2Uf/ZKhfxAFGZLev/nUqX807yAcCgYAukqe5zjKrR+O2lNSWOlQ3\n4s9hFhgbunLKgv2HktMdSMw1Gx0tiv4+1lH8qXb23pZtGMCVX4c2BbSyBhcGwVqJ\nHVR3AsiXi4+uKN+G4EhM1+bBijqe8nRWZnzuG+mcst7PbSy3LDAyOosw7cP/zmBY\n7x1InsJtNWqgUpj7mmVlcA==\n-----END PRIVATE KEY-----\n'
};

// ─── Google Auth ───────────────────────────────────────────────────────────────
let googleTokenCache = null;

function base64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function getGoogleToken() {
  if (googleTokenCache && googleTokenCache.exp > Date.now()) return googleTokenCache.token;

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const claim = base64url(Buffer.from(JSON.stringify({
    iss: GOOGLE_SA.client_email,
    scope: 'https://www.googleapis.com/auth/calendar',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  })));

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(header + '.' + claim);
  const sig = base64url(sign.sign(GOOGLE_SA.private_key));
  const jwt = header + '.' + claim + '.' + sig;

  return new Promise((resolve, reject) => {
    const body = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;
    const req = https.request({
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const r = JSON.parse(d);
        if (r.access_token) {
          googleTokenCache = { token: r.access_token, exp: Date.now() + 3500000 };
          resolve(r.access_token);
        } else {
          console.log('Google token error:', d);
          reject(new Error('Google auth failed'));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── Google Calendar ───────────────────────────────────────────────────────────
async function getAvailableSlots(dateStr) {
  // dateStr: "2026-07-01"
  const token = await getGoogleToken();
  const timeMin = encodeURIComponent(dateStr + 'T00:00:00-03:00');
  const timeMax = encodeURIComponent(dateStr + 'T23:59:59-03:00');
  const calId = encodeURIComponent(CALENDAR_ID);

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'www.googleapis.com',
      path: `/calendar/v3/calendars/${calId}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const events = JSON.parse(d).items || [];
          const busyHours = events.map(e => {
            const start = new Date(e.start.dateTime || e.start.date);
            return start.getHours();
          });

          // Horários disponíveis: 9h-18h excluindo ocupados
          const allSlots = [9,10,11,14,15,16,17];
          const available = allSlots.filter(h => !busyHours.includes(h));
          resolve(available.map(h => `${h}:00`));
        } catch (e) {
          console.log('Calendar parse error:', e.message);
          resolve(['9:00','10:00','11:00','14:00','15:00','16:00','17:00']);
        }
      });
    });
    req.on('error', () => resolve([]));
    req.end();
  });
}

async function createAppointment(name, phone, service, dateStr, timeStr) {
  const token = await getGoogleToken();
  const calId = encodeURIComponent(CALENDAR_ID);

  const [hour] = timeStr.split(':').map(Number);
  const start = new Date(`${dateStr}T${String(hour).padStart(2,'0')}:00:00-03:00`);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const event = {
    summary: `${service} - ${name}`,
    description: `Cliente: ${name}\nWhatsApp: ${phone}\nServiço: ${service}`,
    start: { dateTime: start.toISOString(), timeZone: 'America/Sao_Paulo' },
    end: { dateTime: end.toISOString(), timeZone: 'America/Sao_Paulo' }
  };

  const body = JSON.stringify(event);

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'www.googleapis.com',
      path: `/calendar/v3/calendars/${calId}/events`,
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const r = JSON.parse(d);
          console.log('Evento criado:', r.id, r.summary);
          resolve(r.id ? true : false);
        } catch (e) {
          console.log('Create event error:', e.message);
          resolve(false);
        }
      });
    });
    req.on('error', () => resolve(false));
    req.write(body);
    req.end();
  });
}

// ─── Supabase ──────────────────────────────────────────────────────────────────
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
  if (tenantCache[slug] && now - tenantCache[slug].ts < CACHE_TTL) return tenantCache[slug].data;

  const tenants = await supabaseRequest(`tenants?slug=eq.${slug}&select=*`);
  if (!tenants || !Array.isArray(tenants) || tenants.length === 0) return null;
  const tenant = tenants[0];

  let systemPrompt = tenant.system_prompt || 'Voce e uma recepcionista virtual de clinica estetica.';

  const faqs = await supabaseRequest(`knowledge_base?tenant_id=eq.${tenant.id}&select=pergunta,resposta`);
  const faqList = Array.isArray(faqs) ? faqs : [];
  if (faqList.length > 0) {
    systemPrompt += '\n\nINFORMACOES DA CLINICA:\n';
    faqList.forEach(f => { systemPrompt += `P: ${f.pergunta}\nR: ${f.resposta}\n\n`; });
  }

  systemPrompt += `\n\nAGENDAMENTO:
Quando o cliente quiser agendar, colete: nome completo, serviço desejado, data preferida.
Após ter essas informações, use a função check_availability para verificar horários disponíveis.
Quando o cliente confirmar o horário, use create_appointment para criar o agendamento.
Sempre confirme o agendamento com: nome, serviço, data e hora.`;

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
    await supabaseRequest('mensagens', 'POST', { tenant_id: tenantId, telefone: phone, role, conteudo: content, canal: 'whatsapp' });
  } catch (e) { console.log('Erro ao salvar mensagem:', e.message); }
}

// ─── OpenAI com Function Calling ──────────────────────────────────────────────
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'check_availability',
      description: 'Verifica horários disponíveis no calendário para uma data específica',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'Data no formato YYYY-MM-DD, ex: 2026-07-01' }
        },
        required: ['date']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_appointment',
      description: 'Cria um agendamento no calendário após o cliente confirmar',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nome completo do cliente' },
          service: { type: 'string', description: 'Serviço a ser realizado' },
          date: { type: 'string', description: 'Data no formato YYYY-MM-DD' },
          time: { type: 'string', description: 'Horário no formato HH:00, ex: 14:00' }
        },
        required: ['name', 'service', 'date', 'time']
      }
    }
  }
];

async function callOpenAI(phone, systemPrompt, history, userMsg) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMsg }
  ];

  let finalReply = '';
  let iterations = 0;

  while (iterations < 3) {
    iterations++;
    const body = JSON.stringify({ model: 'gpt-4o', messages, tools: TOOLS, max_tokens: 500 });

    const response = await new Promise((resolve) => {
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
          try { resolve(JSON.parse(d)); }
          catch (e) { resolve(null); }
        });
      });
      req.on('error', () => resolve(null));
      req.write(body);
      req.end();
    });

    if (!response || !response.choices) {
      console.log('OpenAI error response:', JSON.stringify(response));
      return 'Desculpe, erro interno.';
    }

    const choice = response.choices[0];

    if (choice.finish_reason === 'tool_calls') {
      const assistantMsg = choice.message;
      messages.push(assistantMsg);

      for (const toolCall of assistantMsg.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments);
        let toolResult = '';

        console.log('Tool call:', toolCall.function.name, args);

        if (toolCall.function.name === 'check_availability') {
          const slots = await getAvailableSlots(args.date);
          toolResult = slots.length > 0
            ? `Horários disponíveis em ${args.date}: ${slots.join(', ')}`
            : `Não há horários disponíveis em ${args.date}.`;
        }

        if (toolCall.function.name === 'create_appointment') {
          const ok = await createAppointment(args.name, phone, args.service, args.date, args.time);
          toolResult = ok
            ? `Agendamento criado com sucesso! ${args.name} - ${args.service} - ${args.date} às ${args.time}`
            : 'Erro ao criar agendamento. Tente novamente.';
        }

        console.log('Tool result:', toolResult);
        messages.push({ role: 'tool', tool_call_id: toolCall.id, content: toolResult });
      }
      continue;
    }

    finalReply = choice.message.content || 'Desculpe, não entendi.';
    break;
  }

  return finalReply;
}

// ─── WhatsApp ─────────────────────────────────────────────────────────────────
function sendWhatsApp(to, text) {
  const body = JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text } });
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

// ─── Main ─────────────────────────────────────────────────────────────────────
async function handleMessage(phone, text) {
  try {
    const tenantData = await getTenantData(DEFAULT_SLUG);
    if (!tenantData) { sendWhatsApp(phone, 'Servico temporariamente indisponivel.'); return; }

    const { tenant, systemPrompt } = tenantData;
    const history = await getHistory(tenant.id, phone);

    await saveMessage(tenant.id, phone, 'user', text);

    const reply = await callOpenAI(phone, systemPrompt, history, text);
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
    if (mode === 'subscribe' && token === VERIFY_TOKEN) { res.writeHead(200); res.end(challenge); }
    else { res.writeHead(403); res.end('Forbidden'); }
  } else if (req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      res.writeHead(200); res.end('OK');
      try {
        const data = JSON.parse(body);
        const msg = data?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
        if (msg && msg.type === 'text') {
          console.log('Message from:', msg.from, 'Text:', msg.text.body);
          handleMessage(msg.from, msg.text.body);
        }
      } catch (e) { console.log('Error:', e.message); }
    });
  }
});

server.listen(process.env.PORT || 3002, () => console.log('Server OK'));
