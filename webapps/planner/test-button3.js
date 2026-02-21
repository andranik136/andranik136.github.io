import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);
  
  console.log('Dispatching click...');
  await page.$eval('button:has-text("New Task List")', (btn) => {
    btn.click();
  });
  await page.waitForTimeout(1000);
  console.log('Done dispatching');
  
  await browser.close();
})();
