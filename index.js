const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'mytoken123';
const IG_TOKEN = process.env.IG_ACCESS_TOKEN;
const CLAUDE_KEY = process.env.CLAUDE_API_KEY;

// Webhook verification
app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);
  }
});

// Messages
app.post('/webhook', async (req, res) => {
  const body = req.body;
  if (body.object === 'instagram') {
    for (const entry of body.entry) {
      for (const msg of (entry.messaging || [])) {
        if (msg.message && !msg.message.is_echo) {
          const text = msg.message.text;
          const senderId = msg.sender.id;
          try {
            const claude = await axios.post(
              'https://api.anthropic.com/v1/messages',
              { model: 'claude-sonnet-4-20250514', max_tokens: 500,
                messages: [{ role: 'user', content: text }] },
              { headers: { 'x-api-key': CLAUDE_KEY,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json' } }
            );
            const reply = claude.data.content[0].text;
            await axios.post(
              https://graph.facebook.com/v18.0/me/messages?access_token=${IG_TOKEN},
              { recipient: { id: senderId }, message: { text: reply } }
            );
          } catch(e) { console.error(e.message); }
        }
      }
    }
    res.sendStatus(200);
  } else { res.sendStatus(404); }
});

app.listen(process.env.PORT || 3000, () => console.log('Bot ishlamoqda!'));
