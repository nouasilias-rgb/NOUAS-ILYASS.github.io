const puppeteer = require('puppeteer-core')
const path = require('path')

;(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    headless: 'new',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1280,800'],
    defaultViewport: { width: 1280, height: 800 }
  })
  const page = await browser.newPage()
  await page.goto('http://localhost:8080', { waitUntil: 'networkidle2', timeout: 120000 })
  await page.waitForSelector('.start', { visible: true, timeout: 120000 })
  await page.click('.start')
  await new Promise(r => setTimeout(r, 7000))

  await page.evaluate(() => {
    const e = window.experience
    e.camera.instance.position.set(-6, 0.6, 2.5)
    e.camera.controls.target.set(0, -1.2, -2)
    e.camera.controls.update()
  })
  await new Promise(r => setTimeout(r, 1200))
  await page.screenshot({ path: path.join(__dirname, 'sign-restored.png') })
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
