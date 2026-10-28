// National / Essential Medicine Directory (v3 spec §11.1)

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

export const NATIONAL_MEDICINE_DIRECTORY: MedicineEntry[] = [
  { id: 'm1', genericName: 'Paracetamol', brandName: 'Dolo 650 / Crocin', category: 'Analgesic / Antipyretic', formulation: 'Tablet', strength: '650 mg', defaultFrequency: 'tds', defaultDurationDays: 3 },
  { id: 'm2', genericName: 'Amoxicillin + Clavulanic Acid', brandName: 'Augmentin', category: 'Antibiotic', formulation: 'Tablet', strength: '625 mg', defaultFrequency: 'bd', defaultDurationDays: 5 },
  { id: 'm3', genericName: 'Pantoprazole', brandName: 'Pan 40', category: 'Proton Pump Inhibitor', formulation: 'Tablet', strength: '40 mg', defaultFrequency: 'od', defaultDurationDays: 7 },
  { id: 'm4', genericName: 'Cetirizine', brandName: 'Cetzine', category: 'Antihistamine', formulation: 'Tablet', strength: '10 mg', defaultFrequency: 'od', defaultDurationDays: 5 },
  { id: 'm5', genericName: 'Azithromycin', brandName: 'Azithral', category: 'Antibiotic', formulation: 'Tablet', strength: '500 mg', defaultFrequency: 'od', defaultDurationDays: 3 },
  { id: 'm6', genericName: 'Metformin', brandName: 'Glucophage / Glycomet', category: 'Antidiabetic', formulation: 'Tablet', strength: '500 mg', defaultFrequency: 'bd', defaultDurationDays: 30 },
  { id: 'm7', genericName: 'Amlodipine', brandName: 'Amlong', category: 'Antihypertensive', formulation: 'Tablet', strength: '5 mg', defaultFrequency: 'od', defaultDurationDays: 30 },
  { id: 'm8', genericName: 'Ibuprofen', brandName: 'Brufen', category: 'NSAID', formulation: 'Tablet', strength: '400 mg', defaultFrequency: 'tds', defaultDurationDays: 3 },
  { id: 'm9', genericName: 'Montelukast + Levocetirizine', brandName: 'Montek-LC', category: 'Antiasthmatic', formulation: 'Tablet', strength: '10mg/5mg', defaultFrequency: 'od', defaultDurationDays: 7 },
  { id: 'm10', genericName: 'Ondansetron', brandName: 'Emeset', category: 'Antiemetic', formulation: 'Tablet', strength: '4 mg', defaultFrequency: 'sos', defaultDurationDays: 3 },
  { id: 'm11', genericName: 'Salbutamol Inhaler', brandName: 'Asthalin', category: 'Bronchodilator', formulation: 'Inhaler', strength: '100 mcg', defaultFrequency: 'sos', defaultDurationDays: 30 },
  { id: 'm12', genericName: 'ORS (Oral Rehydration Salts)', brandName: 'Electral', category: 'Electrolyte Replenisher', formulation: 'Sachet', strength: '21.8 g', defaultFrequency: 'sos', defaultDurationDays: 3 },
]

export function searchMedicines(query: string): MedicineEntry[] {
  if (!query || query.trim() === '') return NATIONAL_MEDICINE_DIRECTORY.slice(0, 8)
  const q = query.toLowerCase()
  return NATIONAL_MEDICINE_DIRECTORY.filter(
    (m) =>
      m.genericName.toLowerCase().includes(q) ||
      m.brandName.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q)
  )
}
