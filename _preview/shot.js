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
  page.on('console', m => { if (m.type() === 'error') console.log('PAGE ERROR:', m.text().slice(0, 300)) })
  await page.goto('http://localhost:8080', { waitUntil: 'networkidle2', timeout: 120000 })

  await page.waitForSelector('.start', { visible: true, timeout: 120000 })
  await page.click('.start')
  await new Promise(r => setTimeout(r, 5000))

  await page.screenshot({ path: path.join(__dirname, 'shot-default.png') })

  async function view(name, pos, target) {
    await page.evaluate((pos, target) => {
      const e = window.experience
      e.camera.instance.position.set(pos[0], pos[1], pos[2])
      e.camera.controls.target.set(target[0], target[1], target[2])
      e.camera.controls.update()
    }, pos, target)
    await new Promise(r => setTimeout(r, 1200))
    await page.screenshot({ path: path.join(__dirname, name) })
  }

  // j zhou menu sign (node at -4.08, -0.37, -4.75)
  await view('shot-jzhou.png', [-5.6, 0.1, -4.0], [-4.05, -0.35, -4.75])
  // big name board view (the jZhou camera transition)
  await view('shot-bigname.png', [-10.2, 6.3, 3.8], [0, 0, -1])
  // wide shop view
  await view('shot-shop.png', [-11.1, -1, -7.6], [0, 0, -1])

  const info = await page.evaluate(() => {
    const rs = window.experience.world.ramenShop
    const out = {}
    for (const k of ['jesseZhouJoined', 'jZhouPink', 'jZhouBlack', 'ramenShop', 'machines', 'misc', 'graphics']) {
      const o = rs[k]
      const b = new window.experience.THREE ? null : null
      out[k] = { visible: o.visible }
    }
    return out
  })
  console.log(JSON.stringify(info))
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
