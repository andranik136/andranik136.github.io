import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('dialog', async dialog => {
    console.log('Dialog opened:', dialog.message());
    await dialog.accept();
  });
  
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);
  
  const initialTitles = await page.$$eval('.space-y-1 .truncate', els => els.map(e => e.textContent));
  console.log('Initial Plans:', initialTitles);
  
  console.log('Clicking 3-dot menu...');
  await page.click('button:has(.lucide-more-horizontal)');
  await page.waitForTimeout(500);
  
  console.log('Clicking Delete Task List...');
  await page.click('button:has-text("Delete Task List")');
  await page.waitForTimeout(1000);
  
  const finalTitles = await page.$$eval('.space-y-1 .truncate', els => els.map(e => e.textContent));
  console.log('Final Plans:', finalTitles);
  
  await browser.close();
})();
