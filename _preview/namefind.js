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
  await new Promise(r => setTimeout(r, 1200))

  const res = await page.evaluate(() => {
    const e = window.experience
    const THREE = e.THREE || window.THREE
    return { hasThree: !!THREE }
  })
  console.log('three on window?', res)

  // Use the app's own three via the canvas renderer if exposed
  const hits = await page.evaluate(() => {
    const e = window.experience
    const scene = e.scene
    const cam = e.camera.instance
    const out = []
    scene.traverse(o => {
      if (o.isMesh) out.push({ name: o.name, parent: o.parent && o.parent.name, visible: o.visible, type: o.type })
    })
    // scene top-level children
    const top = scene.children.map(c => ({ name: c.name, type: c.type, children: c.children.length }))
    return { out, top }
  })
  console.log(JSON.stringify(hits.top, null, 1))
  console.log(JSON.stringify(hits.out.filter(m => !m.parent || m.parent === 'Scene'), null, 1))

  // clip region of the name text at the bottom
  await page.screenshot({ path: path.join(__dirname, 'name-crop.png'), clip: { x: 300, y: 620, width: 700, height: 180 } })
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
