const puppeteer = require('puppeteer-core')

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

  const result = await page.evaluate(() => {
    const e = window.experience
    const renderer = e.renderer.instance
    const scene = e.scene
    const cam = e.camera.instance
    cam.position.set(-2, 0.8, 3.5)
    cam.lookAt(-1, -2.9, 0.3)
    cam.updateMatrixWorld()

    const gl = renderer.getContext()
    const canvas = renderer.domElement
    const dpr = renderer.getPixelRatio()
    const W = canvas.width, H = canvas.height

    // sample rect in CSS px -> device px, flip Y for gl
    const x0 = 380 * dpr, x1 = 440 * dpr
    const yTop = 460 * dpr, yBot = 700 * dpr
    const rx = Math.round(x0)
    const ry = Math.round(H - yBot)
    const rw = Math.round(x1 - x0)
    const rh = Math.round(yBot - yTop)

    const buf = new Uint8Array(rw * rh * 4)
    const measure = () => {
      renderer.render(scene, cam)
      gl.readPixels(rx, ry, rw, rh, gl.RGBA, gl.UNSIGNED_BYTE, buf)
      let sum = 0
      for (let i = 0; i < buf.length; i += 4) sum += (buf[i] + buf[i + 1] + buf[i + 2]) / 3
      return sum / (buf.length / 4)
    }

    // baseline: hide nothing, render loop may overwrite; render manually
    const base = measure()

    const meshes = []
    scene.traverse(o => { if (o.isMesh) meshes.push(o) })

    const out = []
    for (const m of meshes) {
      if (m === e.world.reflections.groundMirror) continue
      const was = m.visible
      m.visible = false
      const v = measure()
      m.visible = was
      out.push({ name: m.name || '(unnamed)', delta: +(v - base).toFixed(2), v: +v.toFixed(2) })
    }
    return { base: +base.toFixed(2), out: out.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 12) }
  })
  console.log(JSON.stringify(result, null, 1))
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
