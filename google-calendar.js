// ─── Google Calendar via Service Account (JWT) ────────────────────────────────
const https = require('https');
const crypto = require('crypto');

const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
let GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || '').trim();
// Remove aspas acidentais no início/fim
GOOGLE_PRIVATE_KEY = GOOGLE_PRIVATE_KEY.replace(/^['"]/, '').replace(/['"];?$/, '');
// Converte \n literais em quebras de linha reais
GOOGLE_PRIVATE_KEY = GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
const CALENDAR_ID = 'c7040a79721b2abb6d6939af11d4363fb9ea4d68741bbbda0f9187fa0f36e250@group.calendar.google.com';

console.log('GOOGLE_PRIVATE_KEY primeiros 30 chars:', GOOGLE_PRIVATE_KEY.slice(0, 30));
console.log('GOOGLE_PRIVATE_KEY últimos 30 chars:', GOOGLE_PRIVATE_KEY.slice(-30));
console.log('GOOGLE_PRIVATE_KEY tem quebras de linha reais:', GOOGLE_PRIVATE_KEY.includes('\n'));

let cachedToken = null;
let tokenExpiry = 0;

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Gera um JWT assinado e troca por access_token OAuth2
async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry - 60000) return cachedToken;

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: GOOGLE_CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/calendar',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const unsigned = base64url(JSON.stringify(header)) + '.' + base64url(JSON.stringify(claim));
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(unsigned);
  sign.end();
  const signature = sign.sign(GOOGLE_PRIVATE_KEY).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const jwt = unsigned + '.' + signature;

  const body = 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + jwt;

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(d);
          if (json.access_token) {
            cachedToken = json.access_token;
            tokenExpiry = Date.now() + (json.expires_in * 1000);
            resolve(cachedToken);
          } else {
            console.log('Erro ao obter token Google:', d);
            resolve(null);
          }
        } catch(e) { console.log('Erro parse token:', e.message); resolve(null); }
      });
    });
    req.on('error', e => { console.log('Erro request token:', e.message); resolve(null); });
    req.write(body);
    req.end();
  });
}

function calendarRequest(path, method, body, calendarId) {
  const calId = calendarId || CALENDAR_ID;
  return new Promise(async (resolve) => {
    const token = await getAccessToken();
    if (!token) return resolve(null);

    const bodyStr = body ? JSON.stringify(body) : null;
    const headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };
    if (bodyStr) headers['Content-Length'] = Buffer.byteLength(bodyStr);

    const req = https.request({
      hostname: 'www.googleapis.com',
      path: '/calendar/v3/calendars/' + encodeURIComponent(calId) + path,
      method, headers
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(d ? JSON.parse(d) : null); } catch(e) { resolve(null); }
      });
    });
    req.on('error', e => { console.log('Erro Calendar API:', e.message); resolve(null); });
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// Verifica disponibilidade num horário específico (retorna true se livre)
// calendarId: opcional — se informado, verifica no calendário do médico específico
async function verificarDisponibilidade(dataISO, duracaoMinutos = 60, calendarId = null) {
  const inicio = new Date(dataISO);
  const fim = new Date(inicio.getTime() + duracaoMinutos * 60000);

  const params = '/events?timeMin=' + encodeURIComponent(inicio.toISOString()) +
                  '&timeMax=' + encodeURIComponent(fim.toISOString()) +
                  '&singleEvents=true';

  const result = await calendarRequest(params, 'GET', null, calendarId);
  if (!result) return { disponivel: false, erro: true };

  const eventos = result.items || [];
  return { disponivel: eventos.length === 0, erro: false, eventosExistentes: eventos.length };
}

// Cria um evento/agendamento
// calendarId: opcional — se informado, cria no calendário do médico específico
async function criarAgendamento({ dataISO, duracaoMinutos = 60, nomeCliente, procedimento, telefone, calendarId = null }) {
  const inicio = new Date(dataISO);
  const fim = new Date(inicio.getTime() + duracaoMinutos * 60000);

  const evento = {
    summary: procedimento + ' - ' + nomeCliente,
    description: 'Agendado via Sofia (voz). Telefone: ' + (telefone || 'não informado'),
    start: { dateTime: inicio.toISOString(), timeZone: 'America/Sao_Paulo' },
    end: { dateTime: fim.toISOString(), timeZone: 'America/Sao_Paulo' }
  };

  const result = await calendarRequest('/events', 'POST', evento, calendarId);
  if (!result || !result.id) {
    console.log('Erro ao criar evento:', JSON.stringify(result));
    return { sucesso: false };
  }
  console.log('Evento criado:', result.id, 'no calendário:', calendarId || 'padrão');
  return { sucesso: true, eventoId: result.id };
}

// Busca agendamentos futuros de um cliente pelo nome
async function getClientAppointments(clientName) {
  const agora = new Date().toISOString();
  const futuro = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
  const params = '/events?timeMin=' + encodeURIComponent(agora) +
                 '&timeMax=' + encodeURIComponent(futuro) +
                 '&singleEvents=true&orderBy=startTime';
  const result = await calendarRequest(params, 'GET');
  if (!result || !result.items) return [];
  const nameLower = clientName.toLowerCase();
  return result.items
    .filter(e => e.summary && e.summary.toLowerCase().includes(nameLower))
    .map(e => ({ id: e.id, summary: e.summary, start: e.start.dateTime || e.start.date }));
}

// Cancela um agendamento pelo ID do evento
async function cancelAppointment(eventId) {
  const result = await calendarRequest('/events/' + eventId, 'DELETE');
  console.log('Cancelamento evento:', eventId);
  return true; // DELETE retorna 204 sem body
}

module.exports = { verificarDisponibilidade, criarAgendamento, getAccessToken, getClientAppointments, cancelAppointment };
