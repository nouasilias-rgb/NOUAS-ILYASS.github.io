const puppeteer = require('puppeteer-core')
const path = require('path')

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'

;(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: 'new',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1280,800'],
    defaultViewport: { width: 1280, height: 800 }
  })
  const page = await browser.newPage()
  page.on('console', m => { if (m.type() === 'error') console.log('PAGE ERROR:', m.text().slice(0, 300)) })
  page.on('pageerror', e => console.log('PAGEERROR:', e.message))
  await page.goto(process.env.URL || 'http://localhost:8080', { waitUntil: 'networkidle2', timeout: 120000 })
  await page.waitForSelector('.start', { visible: true, timeout: 120000 })
  await page.click('.start')
  await new Promise(r => setTimeout(r, 7000))

  const views = [
    ['name-front', [-10.2, 6.3, 3.8], [0, 0, -1]],
    ['name-low', [-6, 0.6, 2.5], [0, -1.2, -2]],
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

  const info = await page.evaluate(() => {
    const e = window.experience
    const out = []
    const model = e.world.ramenShop.model
    model.traverse(o => {
      if (o.isMesh) out.push({ name: o.name, parent: o.parent && o.parent.name, mat: o.material && o.material.type })
    })
    return out
  })
  console.log(JSON.stringify(info))
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
