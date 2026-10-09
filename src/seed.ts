/**
 * JeevanCare Main Seed Script -- Portfolio & UAT Quality Dataset
 *
 * Command:
 *   npm run seed
 *
 * Idempotent seeder populating the Thrissur City, Kerala dataset:
 *   - SuperAdmin: admin@test.com
 *   - Owners: owner1@test.com to owner10@test.com
 *   - Receptionists: staff1@test.com to staff10@test.com
 *   - Doctors: doctor1@test.com to doctor5@test.com (plus other specialists)
 *   - Patients: patient1@test.com to patient10@test.com
 *   Password for all test accounts: Test@123
 */
import 'dotenv/config'
import { seedTestUatData, checkSeedSafety } from './seedTest'

const safety = checkSeedSafety()
if (!safety.ok) {
  console.error(`Seed safety check failed: ${safety.reason}`)
  process.exit(1)
}

seedTestUatData().then(() => {
  console.log('JeevanCare Thrissur City dataset seed completed successfully.')
  process.exit(0)
}).catch((err) => {
  console.error('Error seeding test data:', err)
  process.exit(1)
})
