// National & Comprehensive Indian Essential Medicine Directory (v3 spec §11.2)
import { COMPREHENSIVE_INDIAN_MEDICINES } from './allIndianMedicines'

export type MedicineEntry = {
  id: string
  genericName: string
  brandName: string
  category: string
  formulation: string
  strength: string
  defaultFrequency: string
  defaultDurationDays: number
}

export const NATIONAL_MEDICINE_DIRECTORY: MedicineEntry[] = COMPREHENSIVE_INDIAN_MEDICINES

export function searchMedicines(query: string): MedicineEntry[] {
  if (!query || query.trim() === '') return NATIONAL_MEDICINE_DIRECTORY.slice(0, 10)
  const q = query.toLowerCase()
  return NATIONAL_MEDICINE_DIRECTORY.filter(
    (m) =>
      m.genericName.toLowerCase().includes(q) ||
      m.brandName.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q)
  )
}
