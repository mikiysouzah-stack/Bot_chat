const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');
const app = express();
let qrData=''; let conectado=false;

async function iniciar(){
  const {state, saveCreds} = await useMultiFileAuthState('./auth');
  const sock = makeWASocket({
    auth: state,
    // ESSAS 2 LINHAS CONSERTAM O ERRO DO TEU PRINT
    shouldIgnoreJid: jid => false,
    getMessage: async () => undefined
  });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async u=>{
    if(u.qr) qrData = await qrcode.toDataURL(u.qr);
    if(u.connection==='open'){conectado=true; qrData=''; console.log("✅ CONECTADA");}
    if(u.connection==='close'){
      conectado=false;
      if(u.lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) iniciar();
    }
  });

  sock.ev.on('messages.upsert', async ({messages})=>{
    try{
      for(const msg of messages){
        try{
          if(!msg.message) continue;
          if(msg.key.fromMe) continue;
          const jid = msg.key.remoteJid;
          
          // FIGURINHA - pega de qualquer jeito
          const hasSticker = msg.message.stickerMessage || msg.message.ephemeralMessage?.message?.stickerMessage || msg.message.viewOnceMessage?.message?.stickerMessage;
          if(hasSticker){
            console.log("FIGURINHA NO GRUPO!");
            await sock.sendMessage(jid, { react: { text: "😂", key: msg.key } }).catch(()=>{});
            await sock.sendMessage(jid, { text: "kkkkkkkkk que figurinha feia da peste kkk 😂😂" }).catch(()=>{});
            continue;
          }

          const txt = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").toLowerCase();
          if(txt === "!menu"){
            await sock.sendMessage(jid, {
