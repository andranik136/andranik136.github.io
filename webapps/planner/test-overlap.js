import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);
  
  const box = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('New Task List'));
    if (!btn) return null;
    const rect = btn.getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  });
  
  if (box) {
    const topElement = await page.evaluate((b) => {
      const el = document.elementFromPoint(b.x, b.y);
      return el ? el.outerHTML : null;
    }, box);
    console.log('Top element at center of button:', topElement);
  } else {
    console.log('Button not found');
  }
  
  await browser.close();
})();
