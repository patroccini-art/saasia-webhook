const http = require('http');
const https = require('https');
const url = require('url');

const VERIFY_TOKEN = 'saasia2025';
const OPENAI_KEY = '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';
const META_TOKEN = 'EAANOM1y6BDkBRwp1HCsa9ZBvpFvPeVozrbi5uXZA30C1ezaVTOaKa22pkY9BxkXPKkHN7IKmGwpbv58HSrR7tQzLQxWWIcQvy1f0TVypItXnWXVt7IUC5HxC79tD8tzARM5yNxOW6VoxbJRRdW3AeX1HEebCZC2P6TS4j5uzYR6Un07jF2gHMQpTCDZBIwp9DMngBwNYeTVZC8GRLMHJa3f4umOhP6UM7rM4n39QnKfTzcJXDPwwpKJBNSo1vtLN3GaWAzifZBZCnEbWlesRSz31H0xm2NOa7F0JiPnVj8ZD';
const PHONE_ID = '1237032046153902';

function callOpenAI(msg, cb) {
  const body = JSON.stringify({model:'gpt-4o',messages:[{role:'system',content:'Você é uma recepcionista de clínica estética. Seja simpática e profissional.'},{role:'user',content:msg}],max_tokens:300});
  const req = https.request({hostname:'api.openai.com',path:'/v1/chat/completions',method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+OPENAI_KEY,'Content-Length':Buffer.byteLength(body)}},res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>{try{cb(JSON.parse(d).choices[0].message.content);}catch(e){cb('Desculpe, erro interno.');}});});
  req.write(body);req.end();
}

function sendWhatsApp(to, text) {
  const body = JSON.stringify({messaging_product:'whatsapp',to,type:'text',text:{body:text}});
  const req = https.request({hostname:'graph.facebook.com',path:'/v18.0/'+PHONE_ID+'/messages',method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+META_TOKEN,'Content-Length':Buffer.byteLength(body)}},res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>console.log('WhatsApp response:',d));});
  req.write(body);req.end();
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  if (req.method === 'GET') {
    const {['hub.mode']:mode,['hub.verify_token']:token,['hub.challenge']:challenge} = parsed.query;
    if (mode === 'subscribe' && token === VERIFY_TOKEN) { res.writeHead(200); res.end(challenge); }
    else { res.writeHead(403); res.end('Forbidden'); }
  } else if (req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      res.writeHead(200); res.end('OK');
      try {
        const data = JSON.parse(body);
        console.log('Received:', JSON.stringify(data));
        const msg = data?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
        if (msg && msg.type === 'text') {
          console.log('Message from:', msg.from, 'Text:', msg.text.body);
          callOpenAI(msg.text.body, reply => {
            console.log('AI reply:', reply);
            sendWhatsApp(msg.from, reply);
          });
        }
      } catch(e) { console.log('Error:', e.message); }
    });
  }
});

server.listen(process.env.PORT || 3002, () => console.log('Server OK'));
