// One-off probe: dump structure of Ticketmelon so we can write a precise parser.
import { chromium } from 'playwright';

const url = process.argv[2] || 'https://www.ticketmelon.com/';
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  viewport: { width: 1280, height: 900 },
});
const p = await ctx.newPage();

// Capture all XHR/fetch requests to find the events API
const apiCalls = [];
p.on('response', async (res) => {
  const u = res.url();
  if (u.includes('/api/') || u.includes('graphql') || u.includes('event')) {
    apiCalls.push({ status: res.status(), url: u.slice(0, 160) });
  }
});

console.log(`→ ${url}`);
await p.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(e => console.log('goto err', e.message));
await p.waitForTimeout(4000);
// Try scrolling to trigger lazy load
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await p.waitForTimeout(2000);

const info = await p.evaluate(() => {
  const links = Array.from(document.querySelectorAll('a[href*="/event"]'))
    .slice(0, 30)
    .map(a => ({ href: a.href, text: a.innerText.trim().slice(0, 80) }))
    .filter(l => l.href);
  // also any link with /e/
  const eLinks = Array.from(document.querySelectorAll('a[href*="/e/"]'))
    .slice(0, 30)
    .map(a => ({ href: a.href, text: a.innerText.trim().slice(0, 80) }));
  // any data-id, data-event attrs
  const dataAttrs = Array.from(document.querySelectorAll('[data-event-id], [data-id]'))
    .slice(0, 5)
    .map(el => ({ tag: el.tagName, attrs: Array.from(el.attributes).map(a => `${a.name}=${a.value.slice(0,40)}`).join(' ') }));
  return {
    title: document.title,
    h1: document.querySelector('h1')?.innerText,
    eventLinks: links,
    eLinks,
    dataAttrs,
  };
});
console.log(JSON.stringify(info, null, 2));

console.log('\n--- API calls captured ---');
console.log(JSON.stringify(apiCalls.slice(0, 30), null, 2));

await b.close();
