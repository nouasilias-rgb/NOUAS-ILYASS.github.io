const puppeteer = require('puppeteer-core')
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
  const out = await page.evaluate(() => {
    const e = window.experience
    const misc = e.world.ramenShop.misc
    const dump = (o, depth) => ({
      name: o.name, type: o.type, depth,
      hasGeom: !!o.geometry,
      groups: o.geometry && o.geometry.groups ? o.geometry.groups.length : null,
      verts: o.geometry && o.geometry.attributes.position ? o.geometry.attributes.position.count : null,
      mats: Array.isArray(o.material) ? o.material.map(m => m.type) : (o.material ? [o.material.type] : []),
      children: o.children.map(c => dump(c, depth + 1))
    })
    return dump(misc, 0)
  })
  console.log(JSON.stringify(out, null, 1).slice(0, 3000))
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
