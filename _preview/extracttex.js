const puppeteer = require('puppeteer-core')
const fs = require('fs')
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

  const dataUrl = await page.evaluate(() => {
    const e = window.experience
    const tex = e.resources.items.floorBakedTexture
    const renderer = e.renderer.instance
    const w = tex.image.width, h = tex.image.height
    const rt = new tex.constructor.prototype.constructor !== undefined ? null : null
    return { w, h, encoding: tex.encoding, format: tex.format, type: tex.type, mipmaps: tex.mipmaps && tex.mipmaps.length }
  })
  console.log(JSON.stringify(dataUrl))

  // Render texture via a fullscreen quad into a render target using three from the app objects
  const png = await page.evaluate(() => {
    const e = window.experience
    const tex = e.resources.items.floorBakedTexture
    const renderer = e.renderer.instance
    const w = 1024, h = 1024
    const scene = new (e.scene.constructor)()
    const cam = e.camera.instance.clone()
    const PlaneGeometry = e.world.ramenShop.hologramBaseGeometry.constructor
    const geo = new PlaneGeometry(2, 2)
    // material: reuse a MeshBasicMaterial from an existing mesh
    const baseMat = e.world.ramenShop.floor.material
    const MeshBasicMaterial = baseMat.constructor
    const mat = new MeshBasicMaterial({ map: tex })
    const MeshCtor = e.world.ramenShop.floor.constructor
    const mesh = new MeshCtor(geo, mat)
    scene.add(mesh)
    const OrthographicCamera = cam.constructor
    const ortho = new OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
    ortho.position.z = 2
    const RT = renderer.getRenderTarget()
    const target = new (e.renderer.instance.constructor) // placeholder
    return null
  }).catch(err => 'ERR ' + err.message)
  console.log('probe:', png)
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
