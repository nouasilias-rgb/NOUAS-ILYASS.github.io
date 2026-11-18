const puppeteer = require('puppeteer-core')
const path = require('path')

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const wait = ms => new Promise(r => setTimeout(r, ms))

;(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: 'new',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1280,800'],
    defaultViewport: { width: 1280, height: 800 }
  })
  const page = await browser.newPage()
  await page.goto('http://localhost:8080', { waitUntil: 'networkidle2', timeout: 120000 })
  await page.waitForSelector('.start', { visible: true, timeout: 120000 })
  await page.click('.start')
  await wait(6000)

  const clip = { x: 470, y: 300, width: 340, height: 200 }
  await page.screenshot({ path: path.join(__dirname, 'n2-all.png'), clip })

  for (const k of ['neonPink', 'neonBlue', 'neonYellow', 'neonGreen', 'misc', 'machines', 'graphics', 'jesseZhouJoined', 'ramenShop', 'chinese']) {
    await page.evaluate(k => { window.experience.world.ramenShop[k].visible = false }, k)
    await wait(250)
    await page.screenshot({ path: path.join(__dirname, `n2-no-${k}.png`), clip })
    await page.evaluate(k => { window.experience.world.ramenShop[k].visible = true }, k)
  }
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
