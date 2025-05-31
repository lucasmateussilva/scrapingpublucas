// scraping-final.js usando perfil Default do Chrome
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const scrapeFlights = async ({ origin, destination, departureDate }) => {
  const browser = await puppeteer.launch({
  headless: false,
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Caminho manual
  userDataDir: 'C:\\Users\\lucas\\AppData\\Local\\Google\\Chrome\\User Data',    // Perfil Default real do Chrome
  defaultViewport: null,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    console.log('Acessando o site...');
    await page.goto('https://seats.aero/search', { waitUntil: 'networkidle2' });

    console.log('Simulando comportamento humano...');
    await page.mouse.move(100, 100);
    await delay(6000);

    const captchaSelector = 'p#TBuuD2.h2.spacer-bottom';
    const captchaExists = await page.$(captchaSelector);
    if (captchaExists) {
      console.log('Captcha detectado. Tentando resolver...');
      const checkboxSelector = 'label.cb-lb input[type="checkbox"]';
      await page.waitForSelector(checkboxSelector, { timeout: 10000 });
      await page.click(checkboxSelector);
      console.log('Captcha resolvido com sucesso.');
      await delay(5000);
    }

    // === LIMPAR ORIGEM (se houver botão "x") ===
const origemXSelector = '#vs1__combobox .vs__deselect';
if (await page.$(origemXSelector)) {
  await page.click(origemXSelector);
  console.log('Origem antiga removida.');
  await delay(1000);
}

// === PREENCHER ORIGEM ===
console.log('Preenchendo campo de origem...');
await page.waitForSelector('input.vs__search[aria-labelledby="vs1__combobox"]');
await page.click('input.vs__search[aria-labelledby="vs1__combobox"]');
for (const char of origin) await page.keyboard.type(char, { delay: 200 });
await delay(1500);
await page.keyboard.press('Enter');
await delay(2000);

// === LIMPAR DESTINO (se houver botão "x") ===
const destinoXSelector = '#vs2__combobox .vs__deselect';
if (await page.$(destinoXSelector)) {
  await page.click(destinoXSelector);
  console.log('Destino antigo removido.');
  await delay(1000);
}

// === PREENCHER DESTINO ===
console.log('Preenchendo campo de destino...');
await page.waitForSelector('input.vs__search[aria-labelledby="vs2__combobox"]');
await page.click('input.vs__search[aria-labelledby="vs2__combobox"]');
for (const char of destination) await page.keyboard.type(char, { delay: 200 });
await delay(1500);
await page.keyboard.press('Enter');
await delay(2000);

    console.log('Selecionando data...');
const [year, month, day] = departureDate.split('-');

await page.waitForSelector('input[data-test-id="dp-input"]', { visible: true });
await page.click('input[data-test-id="dp-input"]');
await delay(1000);

// Scrolla até o calendário aparecer
await page.evaluate(() => {
  document.querySelector('input[data-test-id="dp-input"]').scrollIntoView({ behavior: 'smooth' });
});
await delay(1000);

// Seleciona o ano
await page.waitForSelector('button[data-dp-element="overlay-year"]', { visible: true });
await page.click('button[data-dp-element="overlay-year"]');
await delay(500);
await page.click(`div[data-test-id="${year}"]`);
await delay(800);

// Seleciona o mês
await page.click('button[data-dp-element="overlay-month"]');
await delay(500);
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
await page.click(`div[data-test-id="${monthNames[parseInt(month, 10) - 1]}"]`);
await delay(800);

// Seleciona o dia
const daySelector = `div.dp__cell_inner.dp__pointer`;
await page.waitForSelector(daySelector, { visible: true });
const days = await page.$$(daySelector);
for (const element of days) {
  const text = await page.evaluate(el => el.textContent.trim(), element);
  if (text === day) {
    await element.click();
    console.log(`📅 Dia ${day} selecionado com sucesso.`);
    break;
  }
}
await delay(2000);


    console.log('Clicando no botão "Buscar"...');
await page.waitForSelector('#submitSearch', { visible: true });
await page.click('#submitSearch');
await delay(4000); // tempo extra após a busca

// Verifica se aparece um alerta de "sem voos"
const alertSelector = '.alert.alert-warning';
const alertExists = await page.$(alertSelector);
if (alertExists) {
  const alertMessage = await page.evaluate(el => el.textContent.trim(), alertExists);
  console.warn(`⚠️ Alerta: ${alertMessage}`);
  return { result: alertMessage };
}

// Tenta clicar no botão da tabela "Econômica"

    console.log('Tentando clicar no botão "Econômica"...');
try {
  await page.waitForFunction(() => {
    const btn = document.querySelector('th[aria-label*="Economy"] span');
    return btn && btn.offsetParent !== null; // visível e clicável
  }, { timeout: 30000 }); // espera até 30s

  await page.click('th[aria-label*="Economy"] span');
  console.log('✅ Botão "Econômica" clicado com sucesso.');
} catch (err) {
  console.log('❌ Não foi possível clicar em "Econômica" – talvez não haja voos disponíveis ou ainda está carregando.');
}

    console.log('Clicando no botão de mais informações...');
    const infoButtonSelector = 'button.open-modal-btn';
    await page.waitForSelector(infoButtonSelector, { timeout: 20000 });
    const infoButtons = await page.$$(infoButtonSelector);

    if (infoButtons.length > 0) {
      await infoButtons[0].click();
      console.log('Botão de mais informações clicado.');
      await delay(5000);

      console.log('Extraindo links do pop-up...');
      const linkSelector = '#bookingOptions a.dropdown-item';
      await page.waitForSelector(linkSelector, { timeout: 20000 });
      const links = await page.$$eval(linkSelector, (elements) =>
        elements.map((el) => `${el.textContent.trim()}, Link:${el.href}`)
      );

      console.log('Links extraídos com sucesso.');
      return { result: links };
    } else {
      console.error('Nenhum botão de mais informações encontrado.');
      return { result: 'Nenhum link de reserva encontrado.' };
    }
  } catch (error) {
    console.error('Erro durante o scraping:', error);
    throw error;
  } finally {
    console.log('Fechando o navegador...');
    await browser.close();
  }
};

module.exports = { scrapeFlights };