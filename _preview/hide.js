const puppeteer = require('puppeteer-core')
const path = require('path')

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'

;(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: 'new',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1280,800'],
    defaultViewport: { width: 1280, height: 800 }
  })
  const page = await browser.newPage()
  page.on('console', m => { if (m.type() === 'error') console.log('PAGE ERROR:', m.text().slice(0, 200)) })
  await page.goto('http://localhost:8080', { waitUntil: 'networkidle2', timeout: 120000 })
  await page.waitForSelector('.start', { visible: true, timeout: 120000 })
  await page.click('.start')
  await new Promise(r => setTimeout(r, 5000))

  await page.evaluate(() => {
    const e = window.experience
    e.camera.instance.position.set(-5.6, 0.1, -4.0)
    e.camera.controls.target.set(-4.05, -0.35, -4.75)
    e.camera.controls.enableDamping = false
    e.camera.controls.update()
  })
  await new Promise(r => setTimeout(r, 800))
  await page.screenshot({ path: path.join(__dirname, 'png-all.png') })

  await page.evaluate(() => {
    const rs = window.experience.world.ramenShop
    rs.jZhouBlack.visible = false
    rs.jZhouPink.visible = false
  })
  await new Promise(r => setTimeout(r, 500))
  await page.screenshot({ path: path.join(__dirname, 'png-nojzhou.png') })

  await page.evaluate(() => {
    const rs = window.experience.world.ramenShop
    rs.jZhouBlack.visible = true
    rs.jZhouPink.visible = true
    const e = window.experience
    e.camera.instance.position.set(-11.1, -1, -7.6)
    e.camera.controls.target.set(0, 0, -1)
    e.camera.controls.update()
  })
  await new Promise(r => setTimeout(r, 800))
  await page.screenshot({ path: path.join(__dirname, 'png-default.png') })

  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
