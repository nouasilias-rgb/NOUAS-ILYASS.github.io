const puppeteer = require('puppeteer-core')
const path = require('path')
;(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    headless: 'new',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    defaultViewport: { width: 1280, height: 800 }
  })
  const page = await browser.newPage()
  page.on('pageerror', e => console.log('PAGEERROR', e.message))
  page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE_ERROR', m.text().slice(0, 200)) })
  await page.goto('http://localhost:8080', { waitUntil: 'networkidle2', timeout: 120000 })
  await page.waitForSelector('.start', { visible: true, timeout: 120000 })
  const pct = await page.evaluate(() => document.body.innerText.trim())
  console.log('preloader text before start:', pct)
  await page.click('.start')
  await new Promise(r => setTimeout(r, 12000))
  await page.screenshot({ path: path.join(__dirname, 'final-scene.png') })
  console.log('shot saved')
  await browser.close()
})().catch(e => { console.error('FATAL', e.message); process.exit(1) })
