const puppeteer = require('puppeteer-core')
;(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    headless: 'new',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1280,800'],
    defaultViewport: { width: 1280, height: 800 }
  })
  const page = await browser.newPage()
  page.on('pageerror', e => console.log('PAGEERROR', e.message))
  page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE_ERROR', m.text().slice(0, 300)) })
  page.on('requestfailed', r => console.log('REQFAIL', r.url(), r.failure() && r.failure().errorText))
  page.on('response', r => { if (r.status() >= 400) console.log('HTTP', r.status(), r.url()) })
  await page.goto('http://localhost:8080', { waitUntil: 'domcontentloaded', timeout: 120000 })
  for (let i = 0; i < 8; i++) {
    await new Promise(r => setTimeout(r, 5000))
    const s = await page.evaluate(() => {
      const e = window.experience
      if (!e || !e.resources) return { boot: false, text: document.body.innerText.trim().slice(0, 60) }
      const r = e.resources
      const missing = r.sources.filter(s => !r.items[s.name]).map(s => s.name + ' [' + s.type + '] ' + s.path)
      return { loaded: r.loaded, toLoad: r.toLoad, missing }
    })
    console.log((i + 1) * 5 + 's', JSON.stringify(s))
    if (s.loaded === s.toLoad) break
  }
  await browser.close()
})().catch(e => { console.error('FATAL', e.message); process.exit(1) })
