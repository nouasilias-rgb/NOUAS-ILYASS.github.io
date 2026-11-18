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
  await new Promise(r => setTimeout(r, 9000))

  const setCam = () => page.evaluate(() => {
    const e = window.experience
    e.camera.instance.position.set(-2, 0.8, 3.5)
    e.camera.controls.target.set(-1, -2.9, 0.3)
    e.camera.controls.update()
  })

  const shot = async (name) => {
    await setCam()
    await new Promise(r => setTimeout(r, 250))
    await page.screenshot({ path: path.join(__dirname, name), clip: { x: 300, y: 300, width: 420, height: 500 } })
    console.log('shot', name)
  }

  const has = await page.evaluate(() => {
    const e = window.experience
    return { reflections: !!e.world.reflections, mirror: !!(e.world.reflections && e.world.reflections.groundMirror) }
  })
  console.log(has)

  await shot('cmp-base.png')

  await page.evaluate(() => {
    const e = window.experience
    if (e.world.reflections && e.world.reflections.groundMirror) e.world.reflections.groundMirror.visible = false
  })
  await shot('cmp-nomirror.png')

  await page.evaluate(() => {
    const e = window.experience
    if (e.world.reflections && e.world.reflections.groundMirror) e.world.reflections.groundMirror.visible = true
    e.scene.traverse(o => { if (o.isMesh && o.name === 'ﺺﻧ') o.visible = false })
  })
  await shot('cmp-noname.png')

  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
