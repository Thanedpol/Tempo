// Probe a single Ticketmelon event page to find the detail API + ticket data.
import { chromium } from 'playwright';

const url = process.argv[2] || 'https://www.ticketmelon.com/vjela/jid';
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
});
const p = await ctx.newPage();

const apiCalls = [];
p.on('response', async (res) => {
  const u = res.url();
  if (u.includes('api-frontend.ticketmelon.com') || u.includes('/api/')) {
    let body = null;
    try { body = (await res.text()).slice(0, 500); } catch {}
    apiCalls.push({ status: res.status(), url: u, bodyHead: body });
  }
});

console.log(`→ ${url}`);
await p.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(e => console.log('goto err', e.message));
await p.waitForTimeout(3000);

const pageInfo = await p.evaluate(() => ({
  title: document.title,
  h1: document.querySelector('h1')?.innerText,
  priceElements: Array.from(document.querySelectorAll('*')).filter(el => /THB|฿|baht/i.test(el.innerText) && el.children.length === 0).slice(0, 8).map(el => el.innerText.slice(0, 80)),
}));
console.log('\n--- page info ---');
console.log(JSON.stringify(pageInfo, null, 2));

console.log('\n--- API calls (api-frontend or /api/) ---');
apiCalls.slice(0, 15).forEach(c => {
  console.log(`[${c.status}] ${c.url.slice(0, 140)}`);
  if (c.bodyHead) console.log(`   body: ${c.bodyHead.replace(/\n/g, ' ').slice(0, 300)}`);
});

await b.close();
