import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);
  
  console.log('Clicking button...');
  await page.click('button:has-text("New Task List")');
  await page.waitForTimeout(1000);
  
  const inputs = await page.$$eval('.space-y-1 input', els => els.map(e => e.value));
  console.log('Inputs found:', inputs);
  
  await browser.close();
})();
