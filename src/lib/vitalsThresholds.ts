// Clinical Vitals Evaluation & Color-Coding Engine (v5.0 Spec)

export type VitalSeverity = 'normal' | 'warning' | 'critical'

export type VitalEvaluation = {
  severity: VitalSeverity
  label: string
  inputClass: string
  badgeClass: string
}

export function evalBpSystolic(val?: number | string | null): VitalEvaluation {
  const num = typeof val === 'string' ? parseFloat(val) : val
  if (num == null || isNaN(num)) {
    return { severity: 'normal', label: '', inputClass: '', badgeClass: '' }
  }
  if (num >= 140) {
    return {
      severity: 'critical',
      label: '🚨 Hypertensive Stage 2',
      inputClass: 'border-red/60 bg-red-soft/60 text-red ring-2 ring-red/30 font-bold',
      badgeClass: 'bg-red text-white border-red/40',
    }
  }
  if (num >= 120) {
    return {
      severity: 'warning',
      label: '⚠️ Elevated BP',
      inputClass: 'border-amber/60 bg-amber-soft/60 text-amber-foreground ring-2 ring-amber/30 font-semibold',
      badgeClass: 'bg-amber text-amber-foreground border-amber/40',
    }
  }
  return {
    severity: 'normal',
    label: '✓ Normal',
    inputClass: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-medium',
    badgeClass: 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/30',
  }
}

export function evalBpDiastolic(val?: number | string | null): VitalEvaluation {
  const num = typeof val === 'string' ? parseFloat(val) : val
  if (num == null || isNaN(num)) {
    return { severity: 'normal', label: '', inputClass: '', badgeClass: '' }
  }
  if (num >= 90) {
    return {
      severity: 'critical',
      label: '🚨 Stage 2 Diastolic High',
      inputClass: 'border-red/60 bg-red-soft/60 text-red ring-2 ring-red/30 font-bold',
      badgeClass: 'bg-red text-white border-red/40',
    }
  }
  if (num >= 80) {
    return {
      severity: 'warning',
      label: '⚠️ Elevated Diastolic',
      inputClass: 'border-amber/60 bg-amber-soft/60 text-amber-foreground ring-2 ring-amber/30 font-semibold',
      badgeClass: 'bg-amber text-amber-foreground border-amber/40',
    }
  }
  return {
    severity: 'normal',
    label: '✓ Normal',
    inputClass: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-medium',
    badgeClass: 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/30',
  }
}

export function evalTemp(val?: number | string | null): VitalEvaluation {
  const num = typeof val === 'string' ? parseFloat(val) : val
  if (num == null || isNaN(num)) {
    return { severity: 'normal', label: '', inputClass: '', badgeClass: '' }
  }
  if (num >= 38.5) {
    return {
      severity: 'critical',
      label: '🚨 High Fever / Hyperpyrexia',
      inputClass: 'border-red/60 bg-red-soft/60 text-red ring-2 ring-red/30 font-bold',
      badgeClass: 'bg-red text-white border-red/40',
    }
  }
  if (num >= 37.6) {
    return {
      severity: 'warning',
      label: '⚠️ Low-grade Fever',
      inputClass: 'border-amber/60 bg-amber-soft/60 text-amber-foreground ring-2 ring-amber/30 font-semibold',
      badgeClass: 'bg-amber text-amber-foreground border-amber/40',
    }
  }
  return {
    severity: 'normal',
    label: '✓ Normal',
    inputClass: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-medium',
    badgeClass: 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/30',
  }
}

export function evalPulse(val?: number | string | null): VitalEvaluation {
  const num = typeof val === 'string' ? parseFloat(val) : val
  if (num == null || isNaN(num)) {
    return { severity: 'normal', label: '', inputClass: '', badgeClass: '' }
  }
  if (num > 100) {
    return {
      severity: 'critical',
      label: '🚨 Severe Tachycardia',
      inputClass: 'border-red/60 bg-red-soft/60 text-red ring-2 ring-red/30 font-bold',
      badgeClass: 'bg-red text-white border-red/40',
    }
  }
  if (num < 60) {
    return {
      severity: 'warning',
      label: '⚠️ Bradycardia Alert',
      inputClass: 'border-amber/60 bg-amber-soft/60 text-amber-foreground ring-2 ring-amber/30 font-semibold',
      badgeClass: 'bg-amber text-amber-foreground border-amber/40',
    }
  }
  return {
    severity: 'normal',
    label: '✓ Normal',
    inputClass: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-medium',
    badgeClass: 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/30',
  }
}

export function getVitalsSummary(vitals?: Record<string, any> | null): {
  hasCritical: boolean
  hasWarning: boolean
  criticalCount: number
  warnings: string[]
} {
  if (!vitals) return { hasCritical: false, hasWarning: false, criticalCount: 0, warnings: [] }

  const evals = [
    evalBpSystolic(vitals.bpSystolic),
    evalBpDiastolic(vitals.bpDiastolic),
    evalTemp(vitals.temperatureC),
    evalPulse(vitals.pulse),
  ]

  const criticals = evals.filter((e) => e.severity === 'critical')
  const warningsList = evals.filter((e) => e.severity === 'warning' || e.severity === 'critical').map((e) => e.label)

  return {
    hasCritical: criticals.length > 0,
    hasWarning: warningsList.length > 0,
    criticalCount: criticals.length,
    warnings: warningsList,
  }
}
