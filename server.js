const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');

const app = express();
let qrData = '';
let conectado = false;

const piadas = [
  "O que o corno e o WiFi tem em comum? Todo mundo usa e so o dono nao sabe a senha! kkk",
  "Por que o homem casado vive mais? Porque quem aguenta a mulher aguenta qualquer doenca!",
  "To devendo tanto que se eu morrer e reencarnar, continuo devendo!",
  "Qual e o cumulo do azar? Ser corno, brocha e ainda ouvir 'foi bom amor, mas acabou rapido!'",
  "Fui no medico e ele disse: para de beber. Eu disse: por que? Ele: porque to tentando te examinar e tu ta tentando me beijar!",
  "Casamento e igual loteria, no comeco e empolgacao, depois descobre que perdeu dinheiro!",
  "90% dos homens traem no pensamento, os outros 10% mentem!",
  "Manda 'mais uma' que a Deilly ta inspirada hoje!"
];

async function iniciar() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth');
  const sock = makeWASocket({ auth: state });
  sock.ev.on('creds.update', saveCreds);
  
  sock.ev.on('connection.update', async (u) => {
    const { connection, lastDisconnect, qr } = u;
    if (qr) {
      qrData = await qrcode.toDataURL(qr);
      console.log('QR GERADO');
    }
    if (connection === 'open') {
      conectado = true;
      qrData = '';
      console.log('CONECTADA');
    }
    if (connection === 'close') {
      conectado = false;
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) iniciar();
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg || msg.key.fromMe) return;
    
    const jid = msg.key.remoteJid;
    
    if (msg.message && msg.message.stickerMessage) {
      try {
        await sock.sendMessage(jid, { react: { text: "😂", key: msg.key } });
        await sock.sendMessage(jid, { text: "kkkkkkkk essa figurinha kkk 😂" });
      } catch (e) { console.log(e); }
      return;
    }

    const texto = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
    if (!texto) return;

    const piada = piadas[Math.floor(Math.random() * piadas.length)];
    await sock.sendMessage(jid, { text: piada });
  });
}

app.get('/', (req,res)=>{
  if(conectado) res.send('<h1>Deilly ON 🔥</h1>');
  else res.send('<h1><a href="/qr">Ver QR Code</a></h1>');
});

app.get('/qr', (req,res)=>{
  if(conectado) return res.send('<h1>✅ Ja conectada!</h1>');
  if(qrData) return res.send('<center><img src="'+qrData+'" width="350"><h3>Escaneia rapido!</h3></center><script>setTimeout(()=>location.reload(),15000)</script>');
  res.send('<h1>Gerando QR... atualiza em 3s</h1><script>setTimeout(()=>location.reload(),3000)</script>');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log('Rodando na porta ' + PORT);
  iniciar();
});
