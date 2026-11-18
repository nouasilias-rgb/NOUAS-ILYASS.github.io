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
  await page.screenshot({ path: path.join(__dirname, 'ins-all.png') })

  const info = await page.evaluate(() => {
    const e = window.experience
    const rs = e.world.ramenShop
    const out = {}
    for (const k of ['ramenShop', 'machines', 'misc', 'graphics', 'jesseZhouJoined', 'jZhouPink', 'jZhouBlack']) {
      const o = rs[k]
      const m = o.material
      out[k] = {
        name: o.name,
        material: m && m.type,
        color: m && m.color && m.color.getHexString(),
        map: !!(m && m.map),
        mapSize: m && m.map && m.map.image ? [m.map.image.width, m.map.image.height] : null,
        mapName: m && m.map && m.map.name,
      }
    }
    return out
  })
  console.log(JSON.stringify(info, null, 2))

  for (const k of ['ramenShop', 'machines', 'misc', 'graphics']) {
    await page.evaluate(k => { window.experience.world.ramenShop[k].visible = false }, k)
    await new Promise(r => setTimeout(r, 400))
    await page.screenshot({ path: path.join(__dirname, `ins-no-${k}.png`) })
    await page.evaluate(k => { window.experience.world.ramenShop[k].visible = true }, k)
  }

  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
