import { chromium } from 'playwright';

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext();
const p = await ctx.newPage();

let captured = null;
p.on('request', (req) => {
  if (req.url().includes('/ticket-types/default')) {
    captured = { url: req.url(), method: req.method(), headers: req.headers() };
  }
});

await p.goto('https://www.ticketmelon.com/vjela/jid', { waitUntil: 'networkidle', timeout: 45000 });
await p.waitForTimeout(2000);

console.log(JSON.stringify(captured, null, 2));
await b.close();
