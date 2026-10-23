const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');
const app = express();
let qrData=''; let conectado=false;

const audios = {
  "corno": "https://www.myinstants.com/media/sounds/corno-mansao.mp3",
  "gemidao": "https://www.myinstants.com/media/sounds/gemidao-do-zap.mp3",
  "tome": "https://www.myinstants.com/media/sounds/tome-tome-tome.mp3",
  "risada": "https://www.myinstants.com/media/sounds/risada-debru.mp3",
  "cavalo": "https://www.myinstants.com/media/sounds/cavalo.mp3",
  "ui": "https://www.myinstants.com/media/sounds/aaaaaah.mp3"
};

async function iniciar(){
  const {state, saveCreds} = await useMultiFileAuthState('./auth');
  const sock = makeWASocket({auth: state});
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async u=>{
    if(u.qr) qrData = await qrcode.toDataURL(u.qr);
    if(u.connection==='open'){conectado=true; qrData='';}
    if(u.connection==='close'){conectado=false; if(u.lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) iniciar();}
  });

  sock.ev.on('messages.upsert', async m=>{
    const msg = m.messages[0]; if(!msg || msg.key.fromMe) return;
    const jid = msg.key.remoteJid;
    const txt = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || "").toLowerCase();

    // SE FOR FIGURINHA -> RESPONDE COM AUDIO + KKK AUTOMATICO
    if(msg.message?.stickerMessage){
      await sock.sendMessage(jid, {react:{text:"😂", key:msg.key}});
      await sock.sendMessage(jid, {text:"kkkkkkkk que figurinha feia kkk"});
      // 50% de chance de mandar áudio de risada
      if(Math.random() > 0.5){
        await sock.sendMessage(jid, {audio:{url:audios.risada}, mimetype:'audio/mpeg', ptt:true});
      }
      return;
    }

    if(!txt) return;

    // COMANDOS NORMAIS
    if(txt === "!menu"){
      return sock.sendMessage(jid, {text:`🔥 *DEILLY BRABA* 🔥

!menu - menu
!piada - piada pesada
!audio lista - lista audios

🤖 *MODO AUTOMATICO LIGADO:*
Se falar "corno" eu solto audio de corno
Se falar "gemidao" eu solto gemidão
Se mandar figurinha eu zoou e mando risada
`});
    }

    // RESPOSTA AUTOMATICA COM AUDIO DE MEME NO GRUPO
    if(txt.includes("corno")){
      await sock.sendMessage(jid, {audio:{url:audios.corno}, mimetype:'audio/mpeg', ptt:true});
      await sock.sendMessage(jid, {text:"CHIFRUDO DETECTADO KKKK 📢"});
    }
    else if(txt.includes("gemidao") || txt.includes("gemidão")){
      await sock.sendMessage(jid, {audio:{url:audios.gemidao}, mimetype:'audio/mpeg', ptt:true});
    }
    else if(txt.includes("tome") || txt.includes("toma")){
      await sock.sendMessage(jid, {audio:{url:audios.tome}, mimetype:'audio/mpeg', ptt:true});
    }
    else if(txt.includes("kkk") || txt.includes("haha")){
      if(Math.random() > 0.7){ // só as vezes pra não spammar
        await sock.sendMessage(jid, {audio:{url:audios.risada}, mimetype:'audio/mpeg', ptt:true});
      }
    }
  });
}

app.get('/', (req,res)=> res.send(conectado?'<h1>Deilly Troll ON 🔥</h1>':'<h1><a href="/qr">Ver QR</a></h1>'));
app.get('/qr', (req,res)=>{
  if(conectado) return res.send('<h1>✅ Conectada! Adiciona ela no grupo e manda corno</h1>');
  if(qrData) return res.send(`<center><img src="${qrData}" width="350"><h2>Escaneia com OUTRO numero</h2></center><script>setTimeout(()=>location.reload(),15000)</script>`);
  res.send('<h1>Gerando QR...</h1><script>setTimeout(()=>location.reload(),3000)</script>');
});
const PORT = process.env.PORT || 10000;
app.listen(PORT, ()=> iniciar());
