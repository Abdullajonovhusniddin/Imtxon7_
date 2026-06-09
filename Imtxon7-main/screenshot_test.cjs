const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Capture console errors
  page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER_ERROR:', error.message));
  
  // Give token so it doesn't redirect to login
  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem('accessToken', 'dummy-token');
    localStorage.setItem('userPhone', 'Admin');
  });

  try {
    await page.goto('http://localhost:5173/groups', { waitUntil: 'networkidle0', timeout: 10000 });
  } catch (e) {
    console.log('Nav error', e.message);
  }
  
  await page.screenshot({ path: 'groups_page_initial_1781002239958.png' });
  console.log('Saved screenshot to groups_page_initial_1781002239958.png');
  
  const html = await page.evaluate(() => document.body.innerHTML);
  fs = require('fs');
  fs.writeFileSync('groups_page_dom.html', html);
  
  await browser.close();
})();
