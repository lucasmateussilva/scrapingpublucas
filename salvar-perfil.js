const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: './user_data', // salva o perfil aqui
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.goto('https://seats.aero/login', { waitUntil: 'networkidle2' });

  console.log('➡️ Faça o login manualmente (Google ou e-mail).');
  console.log('⏳ Depois de logar, NÃO feche. Apenas aguarde.');

  // Espera indefinida até você fechar manualmente o navegador
})();
