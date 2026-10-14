// After a production deploy, tell IndexNow (Bing, Yandex and others) about every URL in the sitemap,
// so new and changed pages get crawled within hours. The key is public by design: nuli.nl/<key>.txt proves we own the site.
const fs = require('fs')
const https = require('https')

const KEY = '7d29e00caefc9cdc771496d04828bff9'

module.exports = {
  onSuccess: async ({ constants }) => {
    if (process.env.CONTEXT !== 'production') return
    const sitemap = fs.readFileSync(`${constants.PUBLISH_DIR}/sitemap.xml`, 'utf8')
    const urlList = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1])
    const body = JSON.stringify({ host: 'nuli.nl', key: KEY, urlList })
    const status = await new Promise((resolve) => {
      const req = https.request('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) },
      }, (res) => resolve(res.statusCode))
      req.on('error', (e) => resolve(e.message))
      req.end(body)
    })
    console.log(`IndexNow: submitted ${urlList.length} URLs, response ${status}`)
  },
}
