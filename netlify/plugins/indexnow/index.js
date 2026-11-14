// After a production deploy, tell IndexNow (Bing, Yandex and others) about every URL in the sitemap,
// so new and changed pages get crawled within hours. The key is public by design: <host>/<key>.txt proves we own the site.
const fs = require('fs')
const https = require('https')

const KEY = '7d29e00caefc9cdc771496d04828bff9'

const submit = (body) => new Promise((resolve) => {
  const req = https.request('https://api.indexnow.org/indexnow', {
    method: 'POST',
    agent: false,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) },
  }, (res) => {
    res.resume()
    resolve(res.statusCode)
  })
  req.on('timeout', () => req.destroy(new Error('timed out')))
  req.on('error', (e) => resolve(e.message))
  req.end(body)
})

module.exports = {
  onSuccess: async ({ constants }) => {
    if (process.env.CONTEXT !== 'production') return
    // nuli.nl, and Mandarin Hero's own site (mandarinhero.app) in dist/mh: the key file is in both.
    for (const [host, dir] of [['nuli.nl', ''], ['mandarinhero.app', '/mh']]) {
      const sitemap = fs.readFileSync(`${constants.PUBLISH_DIR}${dir}/sitemap.xml`, 'utf8')
      const urlList = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1])
      const status = await submit(JSON.stringify({ host, key: KEY, urlList }))
      console.log(`IndexNow: submitted ${urlList.length} ${host} URLs, response ${status}`)
    }
  },
}
