const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot Deilly online! 💖');
});

app.post('/webhook', (req, res) => {
  console.log('Mensagem recebida:', req.body);
  // Aqui vai a lógica do bot
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Bot rodando na porta ${PORT}`);
});
