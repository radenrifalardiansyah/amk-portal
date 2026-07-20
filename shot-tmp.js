const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: '/private/tmp/claude-501/-Users-Raden-Rifal-Project-RMedia-Solutions-amk-portal/09a921ae-c557-41b4-bebe-7f7988a39450/scratchpad/navbar-before.png', clip: { x: 0, y: 0, width: 1440, height: 100 } });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/private/tmp/claude-501/-Users-Raden-Rifal-Project-RMedia-Solutions-amk-portal/09a921ae-c557-41b4-bebe-7f7988a39450/scratchpad/footer-before.png', fullPage: false });
  await browser.close();
})();
