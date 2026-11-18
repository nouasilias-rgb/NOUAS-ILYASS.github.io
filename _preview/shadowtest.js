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
    e.camera.instance.position.set(-2, 0.8, 3.5)
    e.camera.controls.target.set(-1, -2.9, 0.3)
    e.camera.controls.update()
  })
  await new Promise(r => setTimeout(r, 1200))

  // list meshes near the floor text
  const near = await page.evaluate(() => {
    const e = window.experience
    const out = []
    e.scene.traverse(o => {
      if (!o.isMesh) return
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox()
      const b = o.geometry.boundingBox.clone()
      o.updateWorldMatrix(true, false)
      b.applyMatrix4(o.matrixWorld)
      const cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2
      if (b.min.y < -2.5 && Math.abs(cx) < 12 && Math.abs(cz) < 12) {
        out.push({ name: o.name, parent: o.parent && o.parent.name, type: o.type,
          mat: o.material && o.material.type, transparent: o.material && o.material.transparent, opacity: o.material && o.material.opacity,
          min: [b.min.x.toFixed(2), b.min.y.toFixed(2), b.min.z.toFixed(2)],
          max: [b.max.x.toFixed(2), b.max.y.toFixed(2), b.max.z.toFixed(2)] })
      }
    })
    return out
  })
  console.log(JSON.stringify(near, null, 1))

  const target = await page.evaluate(() => {
    const e = window.experience
    let hit = null
    e.scene.traverse(o => { if (o.isMesh && o.name === 'ﺺﻧ') hit = o })
    if (hit) hit.visible = false
    return !!hit
  })
  console.log('hid node?', target)
  await new Promise(r => setTimeout(r, 800))
  await page.screenshot({ path: path.join(__dirname, 'close-noname.png') })

  // now also hide the mirror
  await page.evaluate(() => {
    const e = window.experience
    if (e.world.reflections && e.world.reflections.groundMirror) e.world.reflections.groundMirror.visible = false
    let hit = null
    e.scene.traverse(o => { if (o.isMesh && o.name === 'ﺺﻧ') hit = o })
    if (hit) hit.visible = true
  })
  await new Promise(r => setTimeout(r, 800))
  await page.screenshot({ path: path.join(__dirname, 'close-nomirror.png') })

  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
