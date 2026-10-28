// Comprehensive Indian Essential & Branded Medicine Catalog (v3 spec §11.2)
import { type MedicineEntry } from './medicineDirectory'

export const COMPREHENSIVE_INDIAN_MEDICINES: MedicineEntry[] = [
  // Analgesics & Antipyretics
  { id: 'im1', genericName: 'Paracetamol', brandName: 'Dolo 650', category: 'Analgesic / Antipyretic', formulation: 'Tablet', strength: '650 mg', defaultFrequency: 'tds', defaultDurationDays: 3 },
  { id: 'im2', genericName: 'Paracetamol', brandName: 'Crocin Advance', category: 'Analgesic / Antipyretic', formulation: 'Tablet', strength: '500 mg', defaultFrequency: 'tds', defaultDurationDays: 3 },
  { id: 'im3', genericName: 'Ibuprofen + Paracetamol', brandName: 'Combiflam', category: 'Analgesic / NSAID', formulation: 'Tablet', strength: '400mg/325mg', defaultFrequency: 'bd', defaultDurationDays: 3 },
  { id: 'im4', genericName: 'Aceclofenac + Paracetamol', brandName: 'Zerodol-P', category: 'Analgesic / NSAID', formulation: 'Tablet', strength: '100mg/325mg', defaultFrequency: 'bd', defaultDurationDays: 5 },
  { id: 'im5', genericName: 'Diclofenac Sodium', brandName: 'Voveran', category: 'Analgesic / NSAID', formulation: 'Tablet', strength: '50 mg', defaultFrequency: 'bd', defaultDurationDays: 5 },
  { id: 'im6', genericName: 'Tramadol', brandName: 'Contramal', category: 'Opioid Analgesic', formulation: 'Capsule', strength: '50 mg', defaultFrequency: 'sos', defaultDurationDays: 3 },

  // Antibiotics
  { id: 'im7', genericName: 'Amoxicillin + Clavulanic Acid', brandName: 'Augmentin 625 DUO', category: 'Antibiotic', formulation: 'Tablet', strength: '625 mg', defaultFrequency: 'bd', defaultDurationDays: 5 },
  { id: 'im8', genericName: 'Azithromycin', brandName: 'Azithral 500', category: 'Antibiotic', formulation: 'Tablet', strength: '500 mg', defaultFrequency: 'od', defaultDurationDays: 3 },
  { id: 'im9', genericName: 'Cefixime', brandName: 'Taxim-O 200', category: 'Antibiotic', formulation: 'Tablet', strength: '200 mg', defaultFrequency: 'bd', defaultDurationDays: 5 },
  { id: 'im10', genericName: 'Ciprofloxacin', brandName: 'Ciplox 500', category: 'Antibiotic', formulation: 'Tablet', strength: '500 mg', defaultFrequency: 'bd', defaultDurationDays: 5 },
  { id: 'im11', genericName: 'Doxycycline', brandName: 'Doxicip 100', category: 'Antibiotic', formulation: 'Capsule', strength: '100 mg', defaultFrequency: 'bd', defaultDurationDays: 7 },
  { id: 'im12', genericName: 'Ofloxacin + Ornidazole', brandName: 'O2', category: 'Antibiotic / Antidiarrheal', formulation: 'Tablet', strength: '200mg/500mg', defaultFrequency: 'bd', defaultDurationDays: 5 },

  // Gastrointestinal & PPIs
  { id: 'im13', genericName: 'Pantoprazole', brandName: 'Pan 40', category: 'Proton Pump Inhibitor', formulation: 'Tablet', strength: '40 mg', defaultFrequency: 'od', defaultDurationDays: 7 },
  { id: 'im14', genericName: 'Omeprazole', brandName: 'Omez 20', category: 'Proton Pump Inhibitor', formulation: 'Capsule', strength: '20 mg', defaultFrequency: 'od', defaultDurationDays: 7 },
  { id: 'im15', genericName: 'Rabeprazole + Domperidone', brandName: 'Rablet-D', category: 'Proton Pump Inhibitor', formulation: 'Tablet', strength: '20mg/10mg', defaultFrequency: 'od', defaultDurationDays: 5 },
  { id: 'im16', genericName: 'Ranitidine', brandName: 'Rantac 150', category: 'H2 Blocker', formulation: 'Tablet', strength: '150 mg', defaultFrequency: 'bd', defaultDurationDays: 5 },
  { id: 'im17', genericName: 'Ondansetron', brandName: 'Emeset 4', category: 'Antiemetic', formulation: 'Tablet', strength: '4 mg', defaultFrequency: 'sos', defaultDurationDays: 3 },
  { id: 'im18', genericName: 'Sucralfate', brandName: 'Sucramid', category: 'Gastroprotectant', formulation: 'Syrup', strength: '10 ml', defaultFrequency: 'tds', defaultDurationDays: 7 },

  // Antihistamines & Respiratory
  { id: 'im19', genericName: 'Cetirizine', brandName: 'Cetzine 10', category: 'Antihistamine', formulation: 'Tablet', strength: '10 mg', defaultFrequency: 'od', defaultDurationDays: 5 },
  { id: 'im20', genericName: 'Levocetirizine', brandName: 'Xyzal', category: 'Antihistamine', formulation: 'Tablet', strength: '5 mg', defaultFrequency: 'od', defaultDurationDays: 5 },
  { id: 'im21', genericName: 'Montelukast + Levocetirizine', brandName: 'Montek-LC', category: 'Antiasthmatic', formulation: 'Tablet', strength: '10mg/5mg', defaultFrequency: 'od', defaultDurationDays: 7 },
  { id: 'im22', genericName: 'Salbutamol', brandName: 'Asthalin Inhaler', category: 'Bronchodilator', formulation: 'Inhaler', strength: '100 mcg', defaultFrequency: 'sos', defaultDurationDays: 30 },
  { id: 'im23', genericName: 'Budesonide', brandName: 'Foracort Inhaler', category: 'Corticosteroid / Inhaler', formulation: 'Inhaler', strength: '200 mcg', defaultFrequency: 'bd', defaultDurationDays: 30 },
  { id: 'im24', genericName: 'Ambroxol + Terbutaline', brandName: 'Ascoril LS Syrup', category: 'Expectorant', formulation: 'Syrup', strength: '100 ml', defaultFrequency: 'tds', defaultDurationDays: 5 },

  // Cardiovascular & Antidiabetic
  { id: 'im25', genericName: 'Metformin', brandName: 'Glycomet 500 SR', category: 'Antidiabetic', formulation: 'Tablet', strength: '500 mg', defaultFrequency: 'bd', defaultDurationDays: 30 },
  { id: 'im26', genericName: 'Glimepiride + Metformin', brandName: 'Amaril-M 2mg', category: 'Antidiabetic', formulation: 'Tablet', strength: '2mg/500mg', defaultFrequency: 'od', defaultDurationDays: 30 },
  { id: 'im27', genericName: 'Amlodipine', brandName: 'Amlong 5', category: 'Antihypertensive', formulation: 'Tablet', strength: '5 mg', defaultFrequency: 'od', defaultDurationDays: 30 },
  { id: 'im28', genericName: 'Telmisartan', brandName: 'Telma 40', category: 'Antihypertensive', formulation: 'Tablet', strength: '40 mg', defaultFrequency: 'od', defaultDurationDays: 30 },
  { id: 'im29', genericName: 'Atorvastatin', brandName: 'Storvas 10', category: 'Statin / Lipid Lowering', formulation: 'Tablet', strength: '10 mg', defaultFrequency: 'od', defaultDurationDays: 30 },
  { id: 'im30', genericName: 'Clopidogrel + Aspirin', brandName: 'Clopitab A 75', category: 'Antiplatelet', formulation: 'Tablet', strength: '75mg/75mg', defaultFrequency: 'od', defaultDurationDays: 30 },

  // Vitamins, Supplements & Electrolytes
  { id: 'im31', genericName: 'Multivitamin + Ginseng', brandName: 'Becadexamin', category: 'Supplement', formulation: 'Capsule', strength: 'Standard', defaultFrequency: 'od', defaultDurationDays: 15 },
  { id: 'im32', genericName: 'Calcium + Vitamin D3', brandName: 'Shelcal 500', category: 'Supplement', formulation: 'Tablet', strength: '500 mg', defaultFrequency: 'od', defaultDurationDays: 30 },
  { id: 'im33', genericName: 'Methylcobalamin (B12)', brandName: 'Nurokind-LC', category: 'Vitamin Supplement', formulation: 'Tablet', strength: '1500 mcg', defaultFrequency: 'od', defaultDurationDays: 10 },
  { id: 'im34', genericName: 'Iron + Folic Acid', brandName: 'Dexorange', category: 'Hematinic', formulation: 'Syrup', strength: '200 ml', defaultFrequency: 'bd', defaultDurationDays: 30 },
  { id: 'im35', genericName: 'ORS Sachet', brandName: 'Electral ORS', category: 'Electrolyte', formulation: 'Sachet', strength: '21.8 g', defaultFrequency: 'sos', defaultDurationDays: 3 },
]
