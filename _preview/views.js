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
  await new Promise(r => setTimeout(r, 6000))

  async function view(name, pos, target, fn) {
    if (fn) await page.evaluate(fn)
    await page.evaluate((pos, target) => {
      const e = window.experience
      e.camera.camAngle.unlocked()
      e.camera.controls.enableDamping = false
      e.camera.instance.position.set(pos[0], pos[1], pos[2])
      e.camera.controls.target.set(target[0], target[1], target[2])
      e.camera.controls.update()
      e.camera.instance.updateMatrixWorld()
    }, pos, target)
    await new Promise(r => setTimeout(r, 700))
    await page.screenshot({ path: path.join(__dirname, name) })
  }

  await view('v-default.png', [-11.1, -1, -7.6], [0, 0, -1])
  await view('v-jzhou.png', [-5.6, 0.1, -4.6], [-4.11, -0.37, -4.75])
  await view('v-bigsign.png', [-6.5, 0.4, 1.4], [-4.4, 1.6, -2.4])
  await view('v-name.png', [-10.2, 6.3, 3.8], [0, 0, -1])

  await view('v-no-black.png', [-5.6, 0.1, -4.6], [-4.11, -0.37, -4.75], () => {
    window.experience.world.ramenShop.jZhouBlack.visible = false
  })
  await view('v-no-pink.png', [-5.6, 0.1, -4.6], [-4.11, -0.37, -4.75], () => {
    window.experience.world.ramenShop.jZhouBlack.visible = true
    window.experience.world.ramenShop.jZhouPink.visible = false
  })
  await view('v-no-both.png', [-5.6, 0.1, -4.6], [-4.11, -0.37, -4.75], () => {
    window.experience.world.ramenShop.jZhouPink.visible = false
    window.experience.world.ramenShop.jZhouBlack.visible = false
  })

  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
