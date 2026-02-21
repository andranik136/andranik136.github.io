import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ bypassCSP: true });
  const page = await context.newPage();
  
  await page.goto('http://localhost:5173');
  // Hard reload
  await page.reload({ waitUntil: 'networkidle' });
  
  const result = await page.evaluate(async () => {
    if (!window.plannerStore) return 'No store';
    return 'Store found!';
  });
  
  console.log('Evaluate result:', result);
  
  await browser.close();
})();
