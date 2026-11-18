const puppeteer = require('puppeteer-core')
const path = require('path')
const fs = require('fs')

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const wait = ms => new Promise(r => setTimeout(r, ms))

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
  await wait(6000)

  await page.evaluate(() => {
    const e = window.experience
    e.camera.camAngle.unlocked()
    e.camera.controls.enableDamping = false
    e.camera.instance.position.set(-6.5, 0.4, 1.4)
    e.camera.controls.target.set(-4.4, 1.6, -2.4)
    e.camera.controls.update()
  })
  await wait(500)

  const dir = path.join(__dirname, 'iso')
  fs.mkdirSync(dir, { recursive: true })
  const clip = { x: 700, y: 330, width: 580, height: 220 }
  await page.screenshot({ path: path.join(dir, 'base.png'), clip })

  const names = await page.evaluate(() => window.experience.world.ramenShop.model.children.map(c => c.name))
  for (const name of names) {
    await page.evaluate(name => {
      const kids = window.experience.world.ramenShop.model.children
      const o = kids.find(c => c.name === name)
      if (o) o.visible = false
    }, name)
    await wait(120)
    await page.screenshot({ path: path.join(dir, name + '.png'), clip })
    await page.evaluate(name => {
      const kids = window.experience.world.ramenShop.model.children
      const o = kids.find(c => c.name === name)
      if (o) o.visible = true
    }, name)
  }
  console.log(names.join('\n'))
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
