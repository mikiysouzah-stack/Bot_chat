const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');
const app = express();
let qrData = '';
let conectado = false;

async function iniciar() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth');
  const sock = makeWASocket({ auth: state });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async (u) => {
    const { connection, lastDisconnect, qr } = u;
    if (qr) {
      qrData = await qrcode.toDataURL(qr);
      console.log('QR NOVO GERADO - ABRA /qr');
    }
    if (connection === 'open') { conectado = true; qrData = ''; console.log('CONECTADO'); }
    if (connection === 'close') {
      conectado = false;
      if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) iniciar();
    }
  });
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.key.fromMe && msg.message) {
      const jid = msg.key.remoteJid;
      const txt = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
      if (txt) await sock.sendMessage(jid, { text: `Oi, sou a Deilly 💖 vc disse: ${txt}` });
    }
  });
}

app.get('/', (req,res)=> res.send(conectado ? '<h1>Deilly Conectada ✅</h1>' : '<h1>Deilly Online - <a href="/qr">Ver QR Code</a></h1>'));
app.get('/qr', (req,res)=>{
  if(conectado) return res.send('<h1>✅ Já conectada!</h1>');
  if(qrData) return res.send(`<center><h1>Escaneia</h1><img src="${qrData}" width="300"><p>Atualiza em 15s</p></center><script>setTimeout(()=>location.reload(),15000)</script>`);
  res.send('<h1>Gerando QR... atualiza em 5s</h1><script>setTimeout(()=>location.reload(),5000)</script>');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, ()=>{ console.log('Bot rodando na porta '+PORT); iniciar(); });
