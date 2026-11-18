const puppeteer = require('puppeteer-core')

;(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    headless: 'new',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    defaultViewport: { width: 800, height: 600 }
  })
  const page = await browser.newPage()
  await page.goto('http://localhost:8080', { waitUntil: 'networkidle2', timeout: 120000 })
  await page.waitForSelector('.start', { visible: true, timeout: 120000 })

  const info = await page.evaluate(() => {
    const e = window.experience
    const floor = e.world.ramenShop.floor
    const g = floor.geometry
    const pos = g.attributes.position
    const uv = g.attributes.uv
    const samples = []
    for (let i = 0; i < pos.count && samples.length < 6; i += Math.max(1, Math.floor(pos.count / 6))) {
      const v = { x: pos.getX(i), y: pos.getY(i), z: pos.getZ(i), u: uv.getX(i), v: uv.getY(i) }
      const w = v
      samples.push(w)
    }
    // vary world bounds
    let minx = 1e9, maxx = -1e9, minz = 1e9, maxz = -1e9
    for (let i = 0; i < pos.count; i++) {
      minx = Math.min(minx, pos.getX(i)); maxx = Math.max(maxx, pos.getX(i))
      minz = Math.min(minz, pos.getZ(i)); maxz = Math.max(maxz, pos.getZ(i))
    }
    return { samples, bounds: { minx, maxx, minz, maxz }, uvCount: uv.count }
  })
  console.log(JSON.stringify(info, null, 1))
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
