const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');
const app = express();

let qrData = '';
let conectado = false;

async function iniciar() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth');
  const sock = makeWASocket({ auth: state, printQRInTerminal: false });
  
  sock.ev.on('creds.update', saveCreds);
  
  sock.ev.on('connection.update', async (u) => {
    if (u.qr) {
      qrData = await qrcode.toDataURL(u.qr);
    }
    if (u.connection === 'open') {
      conectado = true;
      qrData = '';
      console.log('BOT CONECTADO');
    }
    if (u.connection === 'close') {
      conectado = false;
      if (u.lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
        iniciar();
      }
    }
  });

  sock.ev.on('messages.upsert', async (m
