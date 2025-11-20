require('dotenv').config();
const express = require('express');
const { OpenAI } = require('openai');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();
app.use(express.json());
app.use(express.static('public'));

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>ZAP</title>
<style>body{background:#000;color:#0f0;text-align:center;padding:20px;font-family:system-ui}
input,button{padding:20px;font-size:2em;width:90%;margin:20px auto;border:2px solid #0f0;background:#000;color:#0f0;border-radius:20px}
button{background:#0f0;color:#000;font-weight:900}</style></head>
<body>
<h1>ZAP ⚡</h1>
<p>Escribe una palabra y lanzo tu imperio</p>
<input id="w" placeholder="limón">
<button onclick="z()">ZAPEAR</button>
<div id="r"></div>
<script>
async function z(){
  const w=document.getElementById('w').value.trim();
  if(!w)return;
  document.getElementById('r').innerHTML='<p>Creando imperio '+w+'</p>';
  const res = await fetch('/api/zap',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({word:w})});
  const j = await res.json();
  if(j.url){
    document.getElementById('r').innerHTML='<h2>Imperio '+w+'</h2><img src="'+j.logo+'" width="300"><img src="'+j.poster+'"><a href="'+j.url+'" style="background:#0f0;color:#000;padding:20px;font-size:2em;border-radius:20px">COMPRAR AHORA</a>';
  }
}
</script>
</body></html>`;

app.get('/', (req, res) => res.send(html));

app.post('/api/zap', async (req, res) => {
  const {word} = req.body;
  try {
    const [logo, poster] = await Promise.all([
      openai.images.generate({model:"dall-e-3", prompt:`Logo premium marca "${word}" fondo transparente`, size:"1024x1024"}),
      openai.images.generate({model:"dall-e-3", prompt:`Poster épico marca "${word}" vertical`, size:"1024x1536"})
    ]);

    const session = await stripe.checkout.sessions.create({
      line_items: [{price_data: {currency: 'usd', product_data: {name: `Imperio ${word}`}, unit_amount: 2999}, quantity: 1}],
      mode: 'payment',
      success_url: req.headers.origin + '/success',
      cancel_url: req.headers.origin
    });

    res.json({url: session.url, logo: logo.data[0].url, poster: poster.data[0].url});
  } catch(e) {res.json({error:"error"});}
});

app.get('/success', (req, res) => res.send('<h1 style="text-align:center;padding:100px;background:#000;color:#0f0;font-size:3em">¡DÓLARES!</h1>'));

app.listen(process.env.PORT || 3000);
