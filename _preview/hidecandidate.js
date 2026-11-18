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
    e.camera.instance.position.set(-6, 0.6, 2.5)
    e.camera.controls.target.set(0, -1.2, -2)
    e.camera.controls.update()
  })
  await new Promise(r => setTimeout(r, 1000))
  await page.screenshot({ path: path.join(__dirname, 'cand-before.png') })

  const info = await page.evaluate(() => {
    const e = window.experience
    const found = []
    e.scene.traverse(o => {
      if (o.isMesh && o.material && o.material.type === 'MeshStandardMaterial') {
        const box = new o.geometry.boundingBox.constructor()
        if (!o.geometry.boundingBox) o.geometry.computeBoundingBox()
        const b = o.geometry.boundingBox
        o.updateWorldMatrix(true, false)
        found.push({ name: o.name, parent: o.parent && o.parent.name, visible: o.visible,
          local: { min: [b.min.x, b.min.y, b.min.z], max: [b.max.x, b.max.y, b.max.z] },
          worldPos: [o.matrixWorld.elements[12], o.matrixWorld.elements[13], o.matrixWorld.elements[14]] })
        o.visible = false
      }
    })
    return found
  })
  console.log(JSON.stringify(info, null, 1))
  await new Promise(r => setTimeout(r, 800))
  await page.screenshot({ path: path.join(__dirname, 'cand-after.png') })
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
