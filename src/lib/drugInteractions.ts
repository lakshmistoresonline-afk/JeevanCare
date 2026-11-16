// Real-Time Drug-Drug Interaction & Contraindication Matrix Engine (v5.0 Clinical Spec)

export type DrugConflictWarning = {
  type: 'drug-drug' | 'allergy'
  title: string
  description: string
  severity: 'high' | 'medium'
}

const KNOWN_DRUG_INTERACTIONS: { drugA: string; drugB: string; title: string; desc: string; severity: 'high' | 'medium' }[] = [
  { drugA: 'aspirin', drugB: 'warfarin', title: 'Increased Bleeding Risk', desc: 'Concomitant use of Aspirin and Warfarin significantly elevates anticoagulant response and gastrointestinal hemorrhage risk.', severity: 'high' },
  { drugA: 'ibuprofen', drugB: 'aspirin', title: 'NSAID Platelet Inhibition Mismatch', desc: 'Ibuprofen may attenuate the irreversible antiplatelet effect of low-dose aspirin.', severity: 'medium' },
  { drugA: 'ciprofloxacin', drugB: 'theophylline', title: 'Theophylline Toxicity Hazard', desc: 'Ciprofloxacin inhibits theophylline metabolism, potentially causing seizures or cardiac arrhythmias.', severity: 'high' },
  { drugA: 'metformin', drugB: 'contrast', title: 'Lactic Acidosis Warning', desc: 'Metformin should be temporarily withheld prior to iodinated radiocontrast procedures.', severity: 'medium' },
  { drugA: 'atorvastatin', drugB: 'erythromycin', title: 'Myopathy & Rhabdomyolysis Risk', desc: 'Erythromycin increases serum levels of Atorvastatin, raising risk of muscle toxicity.', severity: 'high' },
]

export function checkClinicalConflicts(
  prescriptionMedicines: string[],
  patientAllergiesText?: string | null
): DrugConflictWarning[] {
  const warnings: DrugConflictWarning[] = []
  const cleanMeds = prescriptionMedicines.map((m) => m.toLowerCase().trim()).filter(Boolean)

  // 1. Check Drug-Drug Interactions
  for (let i = 0; i < cleanMeds.length; i++) {
    for (let j = i + 1; j < cleanMeds.length; j++) {
      const medA = cleanMeds[i]
      const medB = cleanMeds[j]

      for (const rule of KNOWN_DRUG_INTERACTIONS) {
        if (
          (medA.includes(rule.drugA) && medB.includes(rule.drugB)) ||
          (medA.includes(rule.drugB) && medB.includes(rule.drugA))
        ) {
          warnings.push({
            type: 'drug-drug',
            title: rule.title,
            description: rule.desc,
            severity: rule.severity,
          })
        }
      }
    }
  }

  // 2. Check Patient Allergies Contraindications
  if (patientAllergiesText && patientAllergiesText.trim()) {
    const allergiesClean = patientAllergiesText.toLowerCase()

    for (const med of cleanMeds) {
      if (allergiesClean.includes('penicillin') && (med.includes('amoxicillin') || med.includes('ampicillin') || med.includes('penicillin') || med.includes('augmentin'))) {
        warnings.push({
          type: 'allergy',
          title: 'Penicillin Hypersensitivity Alert',
          description: `Patient has documented Penicillin allergy. Prescribing '${med}' carries a severe risk of anaphylaxis.`,
          severity: 'high',
        })
      }
      if (allergiesClean.includes('sulfa') && (med.includes('bactrim') || med.includes('sulfamethoxazole') || med.includes('cotrimoxazole'))) {
        warnings.push({
          type: 'allergy',
          title: 'Sulfa Drug Sensitivity Alert',
          description: `Patient has documented Sulfa allergy. '${med}' is contraindicated.`,
          severity: 'high',
        })
      }
      if (allergiesClean.includes('nsaid') && (med.includes('ibuprofen') || med.includes('diclofenac') || med.includes('naproxen'))) {
        warnings.push({
          type: 'allergy',
          title: 'NSAID Sensitivity Warning',
          description: `Patient has documented NSAID intolerance. Consider alternative analgesics like Paracetamol.`,
          severity: 'medium',
        })
      }
    }
  }

  return warnings
}
