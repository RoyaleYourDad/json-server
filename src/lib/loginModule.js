// Core auth logic
import puppeteer from 'puppeteer';

export const authenticate = async ({ username, password, headless = true, browser: existingBrowser = null } = {}) => {
  if (!username || !password) {
    throw new Error('Missing credentials');
  }

  const browser = existingBrowser || await puppeteer.launch({
    headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process'
    ],
    timeout: 60000
  });

  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(60000);
  await page.setViewport({ width: 1200, height: 800 });

  try {
    await page.goto('https://student.tcti.uz/dashboard/login', { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await page.type('#formstudentlogin-login', username, { delay: 50 });
    await page.type('#formstudentlogin-password', password, { delay: 50 });
    
    const rememberCheckbox = await page.$('input#rememberMe');
    if (rememberCheckbox && !(await page.$eval('input#rememberMe', el => el.checked))) {
      await page.click('label[for="rememberMe"]');
    }
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('button[type="submit"]')
    ]);

    const currentUrl = page.url();
    if (currentUrl.includes('login')) {
      throw new Error('Authentication failed');
    }

    return { browser, page };
  } catch (error) {
    if (!existingBrowser) await browser.close();
    throw error;
  }
};