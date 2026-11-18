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

  const out = await page.evaluate(() => {
    const e = window.experience
    const cam = e.camera.instance
    cam.position.set(-5.6, 0.1, -4.0)
    e.camera.controls.target.set(-4.05, -0.35, -4.75)
    e.camera.controls.enableDamping = false
    e.camera.controls.update()
    cam.updateMatrixWorld()

    const rc = e.rayCaster.raycaster
    const cur = e.rayCaster.cursor
    const results = []
    // sign area in the earlier screenshot: x 700..1200, y 200..330 of 1280x800
    for (const [px, py] of [[850, 240], [900, 270], [980, 250], [1050, 290], [760, 300], [1100, 320]]) {
      cur.x = px / 1280 * 2 - 1
      cur.y = -(py / 800) * 2 + 1
      rc.setFromCamera(cur, cam)
      const hits = rc.intersectObjects(e.scene.children, true)
      if (hits.length) {
        const o = hits[0].object
        let chain = []
        let p = o
        while (p) { chain.unshift(p.name || p.type); p = p.parent }
        const m = o.material
        results.push({
          px, py, chain: chain.join(' > '),
          uv: hits[0].uv ? [hits[0].uv.x.toFixed(3), hits[0].uv.y.toFixed(3)] : null,
          color: m && m.color ? m.color.getHexString() : null,
          mapSize: m && m.map && m.map.image ? [m.map.image.width, m.map.image.height] : null,
        })
      }
    }
    return results
  })
  console.log(JSON.stringify(out, null, 2))
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
