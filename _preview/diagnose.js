const puppeteer = require('puppeteer-core')

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const URL = process.env.URL || 'http://localhost:8081'

;(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: 'new',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1280,800'],
    defaultViewport: { width: 1280, height: 800 }
  })
  const page = await browser.newPage()
  page.on('console', m => console.log('CONSOLE[' + m.type() + ']:', m.text().slice(0, 500)))
  page.on('pageerror', e => console.log('PAGEERROR:', (e && e.stack || String(e)).slice(0, 1500)))
  page.on('requestfailed', r => console.log('REQFAIL:', r.url(), r.failure() && r.failure().errorText))

  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 180000 })
  console.log('--- loaded ---')
  await new Promise(r => setTimeout(r, 8000))

  const state = await page.evaluate(() => {
    const e = window.experience
    const out = { hasExperience: !!e }
    if (!e) return out
    out.progress = e.resources && e.resources.progress
    out.loaded = e.resources && e.resources.loaded
    out.ready = !!(e.world && e.world.ramenShop)
    if (e.world && e.world.ramenShop) {
      const rs = e.world.ramenShop
      out.children = Object.keys(rs).filter(k => rs[k] && rs[k].isObject3D && k !== 'model')
      out.missing = ['ramenShop','machines','floor','misc','graphics','jesseZhouJoined','fan1','fan2','dish','dishStand','bigScreen','arcadeScreen','smallScreen1','vendingMachineScreen','easelFrontGraphic']
        .filter(k => !rs[k])
    }
    out.sceneChildren = e.scene && e.scene.children.length
    return out
  })
  console.log('STATE:', JSON.stringify(state, null, 2))

  const startVisible = await page.$('.start')
  if (startVisible) {
    console.log('start button found, clicking')
    try { await page.click('.start') } catch (err) { console.log('click failed', err.message) }
    await new Promise(r => setTimeout(r, 6000))
    console.log('after click state:', JSON.stringify(await page.evaluate(() => {
      const e = window.experience
      return { ready: !!(e.world && e.world.ramenShop), sceneChildren: e.scene && e.scene.children.length }
    })))
  }

  await page.screenshot({ path: require('path').join(__dirname, 'diagnose.png') })
  await browser.close()
})().catch(e => { console.error('SCRIPT ERROR', e); process.exit(1) })
