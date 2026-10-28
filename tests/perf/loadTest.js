// k6 Synthetic Load Testing Script for Peak OPD Rush Hours (v3 spec §10.2)
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<250'],
    http_req_failed: ['rate<0.01'],
  },
}

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000'

export default function () {
  const homeRes = http.get(`${BASE_URL}/`)
  check(homeRes, { 'homepage status is 200': (r) => r.status === 200 })

  const clinicsRes = http.get(`${BASE_URL}/clinics`)
  check(clinicsRes, { 'clinics page status is 200': (r) => r.status === 200 })

  const loginRes = http.get(`${BASE_URL}/login`)
  check(loginRes, { 'login page status is 200': (r) => r.status === 200 })

  sleep(1)
}
