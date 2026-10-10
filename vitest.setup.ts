import 'dotenv/config'

// Enforce an isolated database for integration test runs
// so running vitest never wipes or modifies the local development database.
process.env.DATABASE_URL = 'mongodb://127.0.0.1:27017/jeevancare-test?replicaSet=rs0'
process.env.PAYLOAD_SECRET = 'jeevancare_test_secret_key_minimum_32_chars_2026'
;(process.env as any).NODE_ENV = 'test'
