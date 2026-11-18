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

  await page.evaluate(() => {
    const e = window.experience
    e.camera.controls.enabled = false
    e.camera.instance.position.set(-5.6, 0.9, 0.4)
    e.camera.instance.lookAt(-3.2, 1.7, -1.6)
    e.camera.instance.updateMatrixWorld()
  })
  await wait(500)
  await page.screenshot({ path: path.join(__dirname, 'n-all.png') })

  for (const k of ['neonPink', 'neonBlue', 'neonYellow', 'neonGreen', 'chinese', 'ramenShop', 'graphics', 'misc']) {
    await page.evaluate(k => { window.experience.world.ramenShop[k].visible = false }, k)
    await wait(250)
    await page.screenshot({ path: path.join(__dirname, `n-no-${k}.png`) })
    await page.evaluate(k => { window.experience.world.ramenShop[k].visible = true }, k)
  }
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
