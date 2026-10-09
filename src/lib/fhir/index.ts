/**
 * FHIR R4 / ABDM Readiness Interoperability Layer
 * Version: 1.0 (FHIR R4 Candidate Mapping)
 *
 * IMPORTANT DISCLAIMER:
 * This layer prepares JeevanCare internal domain models for future standards-based
 * digital health interoperability (FHIR R4 / ABDM). It does NOT call live government
 * APIs or fabricate ABHA credentials.
 */

import { relId } from '@/lib/utils'

export type FhirResource = { resourceType: string; id: string; [key: string]: unknown }

/** Convert JeevanCare Patient doc into FHIR R4 Patient candidate. */
export function toFhirPatient(patient: any): FhirResource {
  if (!patient) throw new Error('Patient document required')
  const pid = String(patient.id)
  return {
    resourceType: 'Patient',
    id: pid,
    identifier: patient.mrn
      ? [{ system: 'https://jeevancare.in/mrn', value: patient.mrn }]
      : [],
    active: true,
    name: [{ text: patient.name }],
    telecom: [
      ...(patient.phone ? [{ system: 'phone', value: patient.phone, use: 'mobile' }] : []),
      ...(patient.email ? [{ system: 'email', value: patient.email }] : []),
    ],
    gender: patient.gender === 'female' ? 'female' : patient.gender === 'male' ? 'male' : 'other',
    birthDate: patient.dateOfBirth ? String(patient.dateOfBirth).slice(0, 10) : undefined,
    address: [
      {
        line: patient.addressLine ? [patient.addressLine] : [],
        city: patient.city || undefined,
        district: patient.district || undefined,
        state: patient.state || undefined,
        postalCode: patient.pinCode || undefined,
        country: 'IN',
      },
    ],
  }
}

/** Convert JeevanCare Doctor user doc into FHIR R4 Practitioner candidate. */
export function toFhirPractitioner(doctor: any): FhirResource {
  if (!doctor) throw new Error('Doctor document required')
  const did = String(doctor.id)
  return {
    resourceType: 'Practitioner',
    id: did,
    identifier: doctor.medicalRegistrationNumber
      ? [
          {
            system: doctor.stateMedicalCouncil || 'https://medicalcouncil.in',
            value: doctor.medicalRegistrationNumber,
          },
        ]
      : [],
    active: doctor.active !== false,
    name: [{ text: doctor.name }],
    qualification: doctor.qualification
      ? [{ code: { text: doctor.qualification } }]
      : [],
  }
}

/** Convert JeevanCare Tenant doc into FHIR R4 Organization candidate. */
export function toFhirOrganization(tenant: any): FhirResource {
  if (!tenant) throw new Error('Tenant document required')
  const tid = String(tenant.id)
  return {
    resourceType: 'Organization',
    id: tid,
    name: tenant.name,
    telecom: tenant.phone ? [{ system: 'phone', value: tenant.phone }] : [],
    address: [
      {
        line: tenant.address ? [tenant.address] : [],
        city: tenant.city || undefined,
        state: tenant.state || undefined,
        country: 'IN',
      },
    ],
  }
}

/** Convert JeevanCare Appointment doc into FHIR R4 Appointment candidate. */
export function toFhirAppointment(appt: any): FhirResource {
  if (!appt) throw new Error('Appointment document required')
  const aid = String(appt.id)
  const patientId = relId(appt.patient)
  const doctorId = relId(appt.doctor)

  const statusMap: Record<string, string> = {
    scheduled: 'booked',
    'checked-in': 'arrived',
    completed: 'fulfilled',
    cancelled: 'cancelled',
    'no-show': 'noshow',
  }

  return {
    resourceType: 'Appointment',
    id: aid,
    status: statusMap[appt.status] || 'proposed',
    start: appt.start,
    end: appt.end,
    minutesDuration: appt.durationMins,
    description: appt.reason || undefined,
    participant: [
      ...(patientId ? [{ actor: { reference: `Patient/${patientId}` }, status: 'accepted' }] : []),
      ...(doctorId ? [{ actor: { reference: `Practitioner/${doctorId}` }, status: 'accepted' }] : []),
    ],
  }
}

/** Convert JeevanCare Visit doc into FHIR R4 Encounter candidate. */
export function toFhirEncounter(visit: any): FhirResource {
  if (!visit) throw new Error('Visit document required')
  const vid = String(visit.id)
  const patientId = relId(visit.patient)
  const doctorId = relId(visit.doctor)

  return {
    resourceType: 'Encounter',
    id: vid,
    status: 'finished',
    class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'ambulatory' },
    subject: patientId ? { reference: `Patient/${patientId}` } : undefined,
    participant: doctorId ? [{ individual: { reference: `Practitioner/${doctorId}` } }] : [],
    period: { start: visit.visitDate },
    reasonCode: visit.symptoms ? [{ text: visit.symptoms }] : [],
    diagnosis: visit.diagnosis ? [{ condition: { display: visit.diagnosis } }] : [],
  }
}

/** Convert JeevanCare Visit vitals into FHIR R4 Observation candidates. */
export function toFhirObservations(visit: any): FhirResource[] {
  if (!visit || !visit.vitals) return []
  const vid = String(visit.id)
  const patientId = relId(visit.patient)
  const v = visit.vitals
  const date = visit.visitDate || new Date().toISOString()
  const observations: FhirResource[] = []

  const subject = patientId ? { reference: `Patient/${patientId}` } : undefined

  if (v.bpSystolic) {
    observations.push({
      resourceType: 'Observation',
      id: `${vid}-bp-sys`,
      status: 'final',
      code: { coding: [{ system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure' }] },
      subject,
      effectiveDateTime: date,
      valueQuantity: { value: v.bpSystolic, unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' },
    })
  }

  if (v.bpDiastolic) {
    observations.push({
      resourceType: 'Observation',
      id: `${vid}-bp-dia`,
      status: 'final',
      code: { coding: [{ system: 'http://loinc.org', code: '8462-4', display: 'Diastolic blood pressure' }] },
      subject,
      effectiveDateTime: date,
      valueQuantity: { value: v.bpDiastolic, unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' },
    })
  }

  if (v.temperatureC) {
    observations.push({
      resourceType: 'Observation',
      id: `${vid}-temp`,
      status: 'final',
      code: { coding: [{ system: 'http://loinc.org', code: '8310-5', display: 'Body temperature' }] },
      subject,
      effectiveDateTime: date,
      valueQuantity: { value: v.temperatureC, unit: 'Cel', system: 'http://unitsofmeasure.org', code: 'Cel' },
    })
  }

  if (v.weightKg) {
    observations.push({
      resourceType: 'Observation',
      id: `${vid}-weight`,
      status: 'final',
      code: { coding: [{ system: 'http://loinc.org', code: '29463-7', display: 'Body weight' }] },
      subject,
      effectiveDateTime: date,
      valueQuantity: { value: v.weightKg, unit: 'kg', system: 'http://unitsofmeasure.org', code: 'kg' },
    })
  }

  if (v.pulse) {
    observations.push({
      resourceType: 'Observation',
      id: `${vid}-pulse`,
      status: 'final',
      code: { coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }] },
      subject,
      effectiveDateTime: date,
      valueQuantity: { value: v.pulse, unit: '/min', system: 'http://unitsofmeasure.org', code: '/min' },
    })
  }

  return observations
}

/** Convert JeevanCare Visit prescription into FHIR R4 MedicationRequest candidates. */
export function toFhirMedicationRequests(visit: any): FhirResource[] {
  if (!visit || !Array.isArray(visit.prescription)) return []
  const vid = String(visit.id)
  const patientId = relId(visit.patient)
  const doctorId = relId(visit.doctor)

  return visit.prescription.map((item: any, idx: number) => ({
    resourceType: 'MedicationRequest',
    id: `${vid}-med-${idx + 1}`,
    status: 'active',
    intent: 'order',
    medicationCodeableConcept: { text: item.medicine },
    subject: patientId ? { reference: `Patient/${patientId}` } : undefined,
    requester: doctorId ? { reference: `Practitioner/${doctorId}` } : undefined,
    dosageInstruction: [
      {
        text: item.instructions || undefined,
        timing: item.frequency ? { code: { text: item.frequency } } : undefined,
        doseAndRate: item.dosage ? [{ doseQuantity: { value: item.dosage } }] : undefined,
      },
    ],
  }))
}

/** Convert JeevanCare MedicalDocument doc into FHIR R4 DiagnosticReport candidate. */
export function toFhirDiagnosticReport(doc: any): FhirResource {
  if (!doc) throw new Error('Document required')
  const did = String(doc.id)
  const patientId = relId(doc.patient)

  return {
    resourceType: 'DiagnosticReport',
    id: did,
    status: doc.status === 'archived' ? 'cancelled' : 'final',
    code: { text: doc.documentType || 'Diagnostic Report' },
    subject: patientId ? { reference: `Patient/${patientId}` } : undefined,
    effectiveDateTime: doc.documentDate,
    presentedForm: [
      {
        contentType: doc.mimeType || 'application/pdf',
        url: `/api/medical-documents/${did}`,
        hash: doc.checksum || undefined,
        title: doc.title,
      },
    ],
  }
}

/** Convert JeevanCare Invoice doc into FHIR R4 Invoice candidate. */
export function toFhirInvoice(invoice: any): FhirResource {
  if (!invoice) throw new Error('Invoice document required')
  const iid = String(invoice.id)
  const patientId = relId(invoice.patient)

  return {
    resourceType: 'Invoice',
    id: iid,
    status: invoice.voided ? 'cancelled' : invoice.paymentStatus === 'paid' ? 'issued' : 'draft',
    subject: patientId ? { reference: `Patient/${patientId}` } : undefined,
    totalGross: {
      value: invoice.totalAmount,
      currency: invoice.currency || 'INR',
    },
    totalNet: {
      value: invoice.balanceDue,
      currency: invoice.currency || 'INR',
    },
    lineItem: Array.isArray(invoice.lineItems)
      ? invoice.lineItems.map((item: any, idx: number) => ({
          sequence: idx + 1,
          chargeItemCodeableConcept: { text: item.description },
          priceComponent: [{ type: 'base', amount: { value: item.amount, currency: invoice.currency || 'INR' } }],
        }))
      : [],
  }
}
