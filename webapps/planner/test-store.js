import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);
  
  const result = await page.evaluate(async () => {
    if (!window.plannerStore) return 'No store';
    try {
      const store = window.plannerStore.getState();
      const newPlanId = await store.createPlan('Test Plan Manual', '#ff0000');
      return 'Success: ' + newPlanId;
    } catch (e) {
      return 'Error: ' + e.message;
    }
  });
  
  console.log('Evaluate result:', result);
  
  await page.waitForTimeout(1000);
  const planTitles = await page.$$eval('.space-y-1 .truncate', els => els.map(e => e.textContent));
  console.log('Plan Titles after manual addition:', planTitles);
  
  await browser.close();
})();
