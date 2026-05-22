const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'mytoken123';
const IG_TOKEN = process.env.IG_ACCESS_TOKEN;
const CLAUDE_KEY = process.env.CLAUDE_API_KEY;

app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  const body = req.body;
  if (body.object !== 'instagram') return;
  for (const entry of body.entry || []) {
    for (const msg of entry.messaging || []) {
      if (!msg.message || msg.message.is_echo) continue;
      const text = msg.message.text;
      const senderId = msg.sender.id;
      if (!text) continue;
      try {
        console.log('Xabar keldi:', text);
        const claude = await axios.post(
          'https://api.anthropic.com/v1/messages',
          { model: 'claude-haiku-4-5-20251001', max_tokens: 500,
            messages: [{ role: 'user', content: text }] },
          { headers: { 'x-api-key': CLAUDE_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json' } }
        );
        const reply = claude.data.content[0].text;
        console.log('Claude javobi:', reply);
        await axios.post(
          'https://graph.facebook.com/v18.0/me/messages',
          { recipient: { id: senderId }, message: { text: reply } },
          { params: { access_token: IG_TOKEN } }
        );
        console.log('Javob yuborildi!');
      } catch(e) {
        console.error('XATO:', e.response ? JSON.stringify(e.response.data) : e.message);
      }
    }
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Bot ishlamoqda!');
});
