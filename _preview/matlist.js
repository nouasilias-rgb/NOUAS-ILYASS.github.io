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
  await new Promise(r => setTimeout(r, 8000))

  const list = await page.evaluate(() => {
    const e = window.experience
    const out = []
    e.scene.traverse(o => {
      if (!o.isMesh) return
      const m = o.material
      if (!m || Array.isArray(m)) { out.push({ name: o.name, array: true }); return }
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox()
      const b = o.geometry.boundingBox.clone()
      o.updateWorldMatrix(true, false)
      b.applyMatrix4(o.matrixWorld)
      out.push({
        name: o.name,
        parent: o.parent && o.parent.name,
        mat: m.type,
        transparent: m.transparent,
        opacity: m.opacity,
        depthWrite: m.depthWrite,
        hasMap: !!m.map,
        mapName: m.map && m.map.name,
        blending: m.blending,
        bbox: [b.min.x.toFixed(1), b.min.y.toFixed(1), b.min.z.toFixed(1), b.max.x.toFixed(1), b.max.y.toFixed(1), b.max.z.toFixed(1)].join(',')
      })
    })
    return out
  })
  for (const o of list) console.log(JSON.stringify(o))
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
