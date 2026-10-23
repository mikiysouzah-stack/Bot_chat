const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');
const app = express();
let qrData = '';
let conectado = false;

const piadas = [
  "Qual a diferença da tua namorada e da garrafa? A garrafa fica na mesa sem fazer bico! 😂",
  "O que o corno e o Wi-Fi tem em comum? Todo mundo usa e só o dono não sabe a senha!",
  "Por que o homem casado vive mais? Porque quem aguenta a mulher aguenta qualquer doença!",
  "Fui no médico e ele disse: você tem que parar de beber. Eu: por quê? Ele: porque eu tô tentando te examinar e tu tá tentando me beijar!",
  "Qual é o cúmulo do azar? Ser corno, brocha e ainda ter que ouvir 'foi bom amor, mas acabou rápido!'",
  "To devendo tanto que se eu morrer e reencarnar, continuo devendo!",
  "Manda 'mais uma' que a Deilly tá inspirada hoje! 🔥",
  "Sabia que 90% dos homens traem a mulher no pensamento? Os outros 10% são mentirosos!",
  "Casamento é igual loteria, no começo é tudo empolgação, depois tu descobre que perdeu dinheiro!",
  "O que o bêbado falou pro poste? Você tá me segurando ou eu tô te segurando?"
];

function pegarPiada() { return piadas[Math.floor(Math.random() * piadas.length)]; }

async function iniciar() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth');
  const sock = makeWASocket({ auth: state });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async (u) => {
    const { connection, lastDisconnect, qr } = u;
    if (qr) qrData = await qrcode.toDataURL(qr);
    if (connection === 'open') { conectado = true; qrData = ''; }
    if (connection === 'close') {
      conectado = false;
      if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) iniciar();
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.key.fromMe && msg.message) {
      const jid = msg.key.remoteJid;

      // 1. SE FOR FIGURINHA -> REAGE COM kkk
      if (msg.message.stickerMessage) {
        console.log('Figurinha recebida!');
        // Reage com emoji
        await sock.sendMessage(jid, { react: { text: "😂", key: msg.key } });
        // Manda kkk
        await sock.sendMessage(jid, { text: "kkkkkkkkk essa figurinha kkk 😂" });
        return;
      }

      const txt = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').toLowerCase();
      if (!txt) return;

      if (txt.includes('piada') || txt.includes('deilly') || txt.includes('mais') || txt.length > 1) {
        await sock.sendMessage(jid, { text: `🔥 ${pegarPiada()}` });
      }
    }
  });
}

app.get('/', (req,res)=> res.send(conectado ? '<h1>Deilly Pesada ON 🔥</h1>' : '<h1><a href="/qr">Ver QR</a></h1>'));
app.get('/qr', (req,res)=>{
  if(conectado) return res.send('<h1>✅ Já conectada!</h1>');
  if(qrData) return res.send(`<center><img src="${qrData}" width="300"><br><h2>Manda figurinha pra testar</h2></center><script>setTimeout(()=>location.reload(),15000)</script>`);
  res.send('<h1>Gerando...</h1><script>setTimeout(()=>location.reload(),5000)</script>');
});
const PORT = process.env.PORT || 
