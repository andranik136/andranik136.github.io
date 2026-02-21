import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.error('BROWSER ERROR:', error.message));
  
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);
  
  console.log('Clicking button...');
  await page.click('button:has-text("New Task List")');
  await page.waitForTimeout(1000);
  
  const planTitles = await page.$$eval('.space-y-1 .truncate', els => els.map(e => e.textContent));
  console.log('Plan Titles:', planTitles);
  
  await browser.close();
})();
