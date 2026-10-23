const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');
const app = express();
let qrCodeData = '';
let isConnected = false;

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth');
    const sock = makeWASocket({ auth: state, printQRInTerminal: true });
    
    sock.ev.on('creds.update', saveCreds);
    
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            qrCodeData = await qrcode.toDataURL(qr);
            console.log('QR GERADO!');
        }
        if (connection === 'open') {
            isConnected = true;
            qrCodeData = '';
            console.log('CONECTADO!');
        }
        if (connection === 'close') {
            isConnected = false;
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && m.type === 'notify') {
            const from = msg.key.remoteJid;
            const texto = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            if (texto) {
                // RESPOSTA DA DEILLY AQUI - pode editar
                await sock.sendMessage(from, { text: `Oi amor, sou a Deilly 💖 Você disse: ${texto}` });
            }
        }
    });
}

app.get('/', (req, res) => {
    if (isConnected) res.send('<h1>Deilly Conectada! 💖✅</h1>');
    else res.send('<h1>Bot Deilly online! <a href="/qr">Ver QR Code</a></h1>');
});

app.get('/qr', (req, res) => {
    if (isConnected) {
        res.send('<h1>✅ Já conectada!</h1>');
    } else if (qrCodeData) {
        res.send(`<h1>Escaneia no WhatsApp</h1><img src="${qrCodeData}" style="width:300px"><br><p>Atualiza a página se não aparecer</p><script>setTimeout(()=>location.reload(),10000)</script>`);
    } else {
        res.send('<h1>Gerando QR... atualiza em 5 seg</h1><script>setTimeout(()=>location.reload(),5000)</script>');
    }
});

app.listen(10000, () => {
    console.log('Servidor rodando');
    startBot();
});
