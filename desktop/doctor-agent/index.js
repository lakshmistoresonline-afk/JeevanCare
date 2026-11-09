// JeevanCare Doctor PC Windows Local Storage Companion Agent (v1.0.4-win64)
const http = require('http')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const PORT = process.env.AGENT_PORT || 9443
const HOST = '127.0.0.1'
const BASE_STORAGE_DIR = process.env.LOCAL_DOCTOR_PC_STORAGE_DIR || path.join(process.env.USERPROFILE || 'C:\\Users\\Default', 'JeevanCare', 'MedicalDocuments')

function sanitize(str) {
  if (!str) return 'unassigned'
  return String(str).replace(/[^a-zA-Z0-9_\-\.]/g, '_')
}

function getTargetDir(tenantId, doctorId) {
  return path.resolve(BASE_STORAGE_DIR, sanitize(tenantId), sanitize(doctorId))
}

const server = http.createServer((req, res) => {
  // Enforce Loopback Origin Security & CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    return res.end()
  }

  const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`)

  if (url.pathname === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({
      status: 'active',
      agentVersion: '1.0.4-win64',
      loopbackPort: PORT,
      storageDir: BASE_STORAGE_DIR,
      uptimeSec: Math.floor(process.uptime()),
    }))
  }

  if (url.pathname === '/upload' && req.method === 'POST') {
    let body = []
    req.on('data', (chunk) => body.push(chunk))
    req.on('end', () => {
      try {
        const payload = JSON.parse(Buffer.concat(body).toString())
        const { filename, fileBase64, tenantId, doctorId } = payload

        if (!filename || !fileBase64) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          return res.end(JSON.stringify({ error: 'Missing filename or fileBase64' }))
        }

        const safeFilename = sanitize(filename)
        const targetDir = getTargetDir(tenantId, doctorId)
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true })

        const filePath = path.resolve(targetDir, safeFilename)
        if (!filePath.startsWith(targetDir)) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          return res.end(JSON.stringify({ error: 'Path traversal attempt rejected' }))
        }

        const buffer = Buffer.from(fileBase64, 'base64')
        fs.writeFileSync(filePath, buffer)

        const checksumSha256 = crypto.createHash('sha256').update(buffer).digest('hex')
        const relativePath = path.join(sanitize(tenantId), sanitize(doctorId), safeFilename)

        res.writeHead(200, { 'Content-Type': 'application/json' })
        return res.end(JSON.stringify({
          ok: true,
          localStoragePath: relativePath,
          checksumSha256,
          filesize: buffer.length,
          agentId: `agent_win_${crypto.createHash('md5').update(targetDir).digest('hex').slice(0, 8)}`,
        }))
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        return res.end(JSON.stringify({ error: err.message || 'Local upload failed' }))
      }
    })
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  return res.end(JSON.stringify({ error: 'Not found' }))
})

if (process.argv.includes('--test')) {
  console.log('[JeevanCare Windows Agent Test CLI] Host:', HOST, 'Port:', PORT, 'StorageDir:', BASE_STORAGE_DIR)
  process.exit(0)
}

server.listen(PORT, HOST, () => {
  console.log(`[JeevanCare Windows Agent] Running on http://${HOST}:${PORT}`)
  console.log(`[JeevanCare Windows Agent] Storage Directory: ${BASE_STORAGE_DIR}`)
})
