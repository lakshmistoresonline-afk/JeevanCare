import { describe, it, expect } from 'vitest'
import {
  toFhirPatient,
  toFhirPractitioner,
  toFhirOrganization,
  toFhirAppointment,
  toFhirEncounter,
  toFhirObservations,
  toFhirMedicationRequests,
  toFhirDiagnosticReport,
  toFhirInvoice,
} from '@/lib/fhir'

describe('FHIR R4 / ABDM Readiness Interoperability Mapping Suite', () => {
  const samplePatient = {
    id: 'pat-101',
    mrn: 'P-0001',
    name: 'Anita Krishnan',
    phone: '+919847011111',
    email: 'anita@test.com',
    gender: 'female',
    dateOfBirth: '1990-05-12T00:00:00.000Z',
    addressLine: 'MG Road, Round West',
    city: 'Thrissur',
    district: 'Thrissur',
    state: 'Kerala',
    pinCode: '680001',
  }

  const sampleDoctor = {
    id: 'doc-202',
    name: 'Dr. Ramesh Kumar',
    qualification: 'MBBS, MD',
    medicalRegistrationNumber: 'KMC-2026-88',
    stateMedicalCouncil: 'Travancore Cochin Medical Council',
    active: true,
  }

  const sampleTenant = {
    id: 'ten-303',
    name: 'JeevanCare Thrissur Clinic',
    phone: '+914872330000',
    address: 'Swaraj Round West',
    city: 'Thrissur',
    state: 'Kerala',
  }

  it('maps JeevanCare Patient to FHIR Patient candidate', () => {
    const fhir = toFhirPatient(samplePatient) as any
    expect(fhir.resourceType).toBe('Patient')
    expect(fhir.id).toBe('pat-101')
    expect(fhir.gender).toBe('female')
    expect(fhir.name[0].text).toBe('Anita Krishnan')
    expect(fhir.identifier[0].value).toBe('P-0001')
  })

  it('maps JeevanCare Doctor to FHIR Practitioner candidate', () => {
    const fhir = toFhirPractitioner(sampleDoctor) as any
    expect(fhir.resourceType).toBe('Practitioner')
    expect(fhir.id).toBe('doc-202')
    expect(fhir.identifier[0].value).toBe('KMC-2026-88')
    expect(fhir.qualification[0].code.text).toBe('MBBS, MD')
  })

  it('maps JeevanCare Clinic to FHIR Organization candidate', () => {
    const fhir = toFhirOrganization(sampleTenant) as any
    expect(fhir.resourceType).toBe('Organization')
    expect(fhir.id).toBe('ten-303')
    expect(fhir.name).toBe('JeevanCare Thrissur Clinic')
  })

  it('maps Appointment, Visit, Observations, and MedicationRequests', () => {
    const sampleAppt = {
      id: 'app-404',
      status: 'scheduled',
      start: '2026-10-10T10:00:00.000Z',
      end: '2026-10-10T10:15:00.000Z',
      durationMins: 15,
      patient: 'pat-101',
      doctor: 'doc-202',
    }

    const sampleVisit = {
      id: 'vis-505',
      visitDate: '2026-10-10T10:05:00.000Z',
      patient: 'pat-101',
      doctor: 'doc-202',
      symptoms: 'High fever and fatigue',
      diagnosis: 'Acute Viral Fever',
      vitals: {
        bpSystolic: 120,
        bpDiastolic: 80,
        temperatureC: 38.5,
        weightKg: 65,
        pulse: 82,
      },
      prescription: [
        { medicine: 'Paracetamol 650mg', dosage: '1 tablet', frequency: '1-0-1 BD', instructions: 'After food' },
      ],
    }

    const fhirAppt = toFhirAppointment(sampleAppt) as any
    expect(fhirAppt.resourceType).toBe('Appointment')
    expect(fhirAppt.status).toBe('booked')

    const fhirEncounter = toFhirEncounter(sampleVisit) as any
    expect(fhirEncounter.resourceType).toBe('Encounter')
    expect(fhirEncounter.status).toBe('finished')

    const observations = toFhirObservations(sampleVisit) as any[]
    expect(observations.length).toBe(5)
    expect(observations[0].code.coding[0].code).toBe('8480-6') // LOINC Systolic

    const medications = toFhirMedicationRequests(sampleVisit) as any[]
    expect(medications.length).toBe(1)
    expect(medications[0].medicationCodeableConcept.text).toBe('Paracetamol 650mg')
  })

  it('maps Medical Document and Invoice candidates', () => {
    const sampleDoc = {
      id: 'doc-606',
      title: 'Blood Test Report',
      documentType: 'BLOOD_TEST',
      patient: 'pat-101',
      documentDate: '2026-10-10T09:00:00.000Z',
      status: 'active',
      mimeType: 'application/pdf',
      checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    }

    const sampleInvoice = {
      id: 'inv-707',
      totalAmount: 750,
      balanceDue: 0,
      currency: 'INR',
      paymentStatus: 'paid',
      patient: 'pat-101',
      lineItems: [{ description: 'Consultation Fee', amount: 750 }],
    }

    const fhirDoc = toFhirDiagnosticReport(sampleDoc) as any
    expect(fhirDoc.resourceType).toBe('DiagnosticReport')
    expect(fhirDoc.status).toBe('final')

    const fhirInvoice = toFhirInvoice(sampleInvoice) as any
    expect(fhirInvoice.resourceType).toBe('Invoice')
    expect(fhirInvoice.status).toBe('issued')
    expect(fhirInvoice.totalGross.value).toBe(750)
  })
})
