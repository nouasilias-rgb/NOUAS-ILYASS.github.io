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
  await new Promise(r => setTimeout(r, 6000))

  const out = await page.evaluate(() => {
    const e = window.experience
    const cam = e.camera.instance
    e.camera.camAngle.unlocked()
    e.camera.controls.enableDamping = false
    cam.position.set(-6.5, 0.4, 1.4)
    e.camera.controls.target.set(-4.4, 1.6, -2.4)
    e.camera.controls.update()
    cam.updateMatrixWorld()

    const rc = e.rayCaster.raycaster
    const cur = e.rayCaster.cursor
    const pts = [[800, 420], [860, 430], [950, 445], [1050, 450], [1150, 445], [1230, 465], [860, 400], [1100, 490], [780, 340], [790, 300]]
    return pts.map(([px, py]) => {
      cur.x = px / 1280 * 2 - 1
      cur.y = -(py / 800) * 2 + 1
      rc.setFromCamera(cur, cam)
      const hits = rc.intersectObjects(e.scene.children, true)
      if (!hits.length) return { px, py, hit: null }
      const h = hits[0]
      const o = h.object
      const m = o.material
      return {
        px, py,
        name: o.name,
        uv: h.uv ? [ +h.uv.x.toFixed(4), +h.uv.y.toFixed(4) ] : null,
        mapSize: m && m.map && m.map.image ? [m.map.image.width, m.map.image.height] : null,
        point: h.point.toArray().map(v => +v.toFixed(2)),
      }
    })
  })
  console.log(JSON.stringify(out, null, 2))
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
