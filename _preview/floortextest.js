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
  await new Promise(r => setTimeout(r, 9000))

  const setCam = () => page.evaluate(() => {
    const e = window.experience
    e.camera.instance.position.set(-2, 0.8, 3.5)
    e.camera.controls.target.set(-1, -2.9, 0.3)
    e.camera.controls.update()
  })
  const shot = async (name) => {
    await setCam()
    await new Promise(r => setTimeout(r, 250))
    await page.screenshot({ path: path.join(__dirname, name), clip: { x: 300, y: 300, width: 420, height: 500 } })
  }

  await shot('floor-withtex.png')

  const info = await page.evaluate(() => {
    const e = window.experience
    const floor = e.world.ramenShop.floor
    const m = floor.material
    const map = m.map
    const out = { mat: m.type, hasMap: !!map, mapType: map && map.constructor.name,
      image: map && map.image ? { w: map.image.width, h: map.image.height, ctor: map.image.constructor.name } : null }
    m.map = null
    m.color.set('#2b2b2b')
    m.needsUpdate = true
    return out
  })
  console.log(JSON.stringify(info))
  await shot('floor-notex.png')

  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
