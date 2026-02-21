import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);
  
  const html = await page.content();
  console.log(html.includes('Create new plan clicked!')); 
  
  const buttons = await page.$$eval('button', els => els.map(b => b.outerHTML));
  console.log('Buttons:', buttons);
  
  await browser.close();
})();
