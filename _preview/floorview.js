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

  const views = [
    ['floor-top', [0, 14, 0.01], [0, -3, 0]],
    ['floor-front', [0, 2, 16], [0, -2.9, 0]],
    ['floor-close', [-2, 0.8, 3.5], [-1, -2.9, 0.3]],
  ]
  for (const [name, pos, target] of views) {
    await page.evaluate((pos, target) => {
      const e = window.experience
      e.camera.instance.position.set(pos[0], pos[1], pos[2])
      e.camera.controls.target.set(target[0], target[1], target[2])
      e.camera.controls.update()
    }, pos, target)
    await new Promise(r => setTimeout(r, 1500))
    await page.screenshot({ path: path.join(__dirname, name + '.png') })
    console.log('saved', name)
  }

  const flat = await page.evaluate(() => {
    const e = window.experience
    const out = []
    e.scene.traverse(o => {
      if (!o.isMesh) return
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox()
      const b = o.geometry.boundingBox.clone()
      o.updateWorldMatrix(true, false)
      b.applyMatrix4(o.matrixWorld)
      const size = [b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z]
      if (b.min.y < -2.6 && size[0] > 1.5 && size[0] < 20 && size[1] < 0.4) {
        out.push({ name: o.name, pos: [o.position.x, o.position.y, o.position.z], size, mat: o.material && o.material.type })
      }
    })
    return out
  })
  console.log(JSON.stringify(flat))
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
