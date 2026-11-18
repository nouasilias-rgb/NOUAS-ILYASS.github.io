const puppeteer = require('puppeteer-core')
const fs = require('fs')

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
  await new Promise(r => setTimeout(r, 6000))

  const dataUrl = await page.evaluate(() => {
    const e = window.experience
    const tex = e.resources.items.floorBakedTexture
    const Renderer = e.renderer.instance.constructor
    const canvas = document.createElement('canvas')
    canvas.width = 1024; canvas.height = 1024
    const renderer = new Renderer({ canvas, antialias: false, preserveDrawingBuffer: true })
    renderer.outputEncoding = e.renderer.instance.outputEncoding
    const Scene = e.scene.constructor
    const scene = new Scene()
    const Geo = e.world.ramenShop.hologramBaseGeometry.constructor
    const geo = new Geo(1.4, 64)
    const Mat = e.world.ramenShop.floor.material.constructor
    const mat = new Mat({ map: tex })
    const MeshC = e.world.ramenShop.floor.constructor
    const mesh = new MeshC(geo, mat)
    scene.add(mesh)
    const Cam = e.camera.instance.constructor
    const cam = new Cam(45, 1, 0.1, 10)
    cam.position.z = 2.5
    renderer.setClearColor(0x000000, 1)
    renderer.render(scene, cam)
    return canvas.toDataURL('image/png')
  })
  const b64 = dataUrl.split(',')[1]
  fs.writeFileSync('tex/floor_runtime.png', Buffer.from(b64, 'base64'))
  console.log('saved _preview/tex/floor_runtime.png', b64.length)
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
