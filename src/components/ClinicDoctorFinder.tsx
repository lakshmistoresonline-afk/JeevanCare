'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

type Clinic = {
  id: string
  name: string
  city?: string | null
  district?: string | null
  state?: string | null
  phone?: string | null
}

type Doctor = {
  id: string
  name: string
  specialty?: string | null
  consultationFee?: number | null
  tenant?: string | { id: string } | null
}

export function ClinicDoctorFinder({
  clinics,
  doctors,
}: {
  clinics: Clinic[]
  doctors: Doctor[]
}) {
  const [selectedState, setSelectedState] = useState('Kerala')
  const [selectedDistrict, setSelectedDistrict] = useState('Thrissur')
  const [selectedArea, setSelectedArea] = useState('All')
  const [selectedClinicId, setSelectedClinicId] = useState('All')
  const [selectedSpecialty, setSelectedSpecialty] = useState('All')

  const areas = useMemo(() => {
    const set = new Set<string>()
    clinics.forEach((c) => {
      if (c.city) set.add(c.city)
    })
    return ['All', ...Array.from(set)]
  }, [clinics])

  const specialties = useMemo(() => {
    const set = new Set<string>()
    doctors.forEach((d) => {
      if (d.specialty) set.add(d.specialty)
    })
    return ['All', ...Array.from(set)]
  }, [doctors])

  const filteredClinics = useMemo(() => {
    return clinics.filter((c) => {
      const matchState = !selectedState || selectedState === 'All' || (c.state ?? 'Kerala') === selectedState
      const matchDistrict = !selectedDistrict || selectedDistrict === 'All' || (c.district ?? 'Thrissur') === selectedDistrict
      const matchArea = selectedArea === 'All' || c.city === selectedArea
      const matchClinic = selectedClinicId === 'All' || c.id === selectedClinicId
      return matchState && matchDistrict && matchArea && matchClinic
    })
  }, [clinics, selectedState, selectedDistrict, selectedArea, selectedClinicId])

  const filteredClinicIds = new Set(filteredClinics.map((c) => c.id))

  const filteredDoctors = useMemo(() => {
    return doctors.filter((d) => {
      const tId = typeof d.tenant === 'object' && d.tenant !== null ? String(d.tenant.id) : String(d.tenant)
      const matchClinic = filteredClinicIds.has(tId)
      const matchSpecialty = selectedSpecialty === 'All' || d.specialty === selectedSpecialty
      return matchClinic && matchSpecialty
    })
  }, [doctors, filteredClinicIds, selectedSpecialty])

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm">
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">Interactive Finder</span>
          <h2 className="mt-2 font-display text-2xl font-semibold">Find Your Doctor &amp; Clinic</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Select your location, clinic, or medical specialty to explore availability and book instantly.
          </p>
        </div>

        {/* Cascading Dropdowns Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">State</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full rounded-xl border border-input bg-canvas px-3 py-2 text-xs font-medium text-ink outline-none focus:border-primary"
            >
              <option value="Kerala">Kerala</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="All">All States</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">District</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full rounded-xl border border-input bg-canvas px-3 py-2 text-xs font-medium text-ink outline-none focus:border-primary"
            >
              <option value="Thrissur">Thrissur</option>
              <option value="Ernakulam">Ernakulam</option>
              <option value="Palakkad">Palakkad</option>
              <option value="All">All Districts</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">City / Area</label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full rounded-xl border border-input bg-canvas px-3 py-2 text-xs font-medium text-ink outline-none focus:border-primary"
            >
              {areas.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Clinic</label>
            <select
              value={selectedClinicId}
              onChange={(e) => setSelectedClinicId(e.target.value)}
              className="w-full rounded-xl border border-input bg-canvas px-3 py-2 text-xs font-medium text-ink outline-none focus:border-primary"
            >
              <option value="All">All Clinics ({filteredClinics.length})</option>
              {filteredClinics.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Specialty</label>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full rounded-xl border border-input bg-canvas px-3 py-2 text-xs font-medium text-ink outline-none focus:border-primary"
            >
              {specialties.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-lg font-semibold">
            Matching Clinics &amp; Doctors ({filteredClinics.length} clinics, {filteredDoctors.length} doctors)
          </h3>
        </div>

        {filteredClinics.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <p className="text-sm text-muted-foreground">No clinics match your selected filters.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredClinics.map((clinic) => {
              const clinicDocs = filteredDoctors.filter((d) => {
                const tId = typeof d.tenant === 'object' && d.tenant !== null ? String(d.tenant.id) : String(d.tenant)
                return tId === clinic.id
              })

              return (
                <div key={clinic.id} className="card-flat flex flex-col justify-between p-6">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-secondary px-2.5 py-1 text-[11px] font-semibold text-primary">
                        {clinic.city || 'Thrissur'}
                      </span>
                      <span className="tabular text-xs text-muted-foreground">{clinic.phone}</span>
                    </div>
                    <h4 className="mt-3 font-display text-lg font-semibold">{clinic.name}</h4>
                    <p className="text-xs text-muted-foreground">{clinic.state || 'Kerala'} · District: {clinic.district || 'Thrissur'}</p>

                    <div className="mt-5 border-t border-border pt-4">
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Doctors ({clinicDocs.length})
                      </div>
                      {clinicDocs.length === 0 ? (
                        <p className="mt-2 text-xs text-faint">No doctors match this filter at this clinic.</p>
                      ) : (
                        <ul className="mt-3 space-y-3">
                          {clinicDocs.map((doc) => (
                            <li key={doc.id} className="flex items-center justify-between rounded-lg border border-border bg-canvas p-3 text-xs">
                              <div>
                                <div className="font-semibold text-ink">Dr. {doc.name}</div>
                                <div className="text-muted-foreground">{doc.specialty || 'General Practitioner'}</div>
                                {doc.consultationFee && (
                                  <div className="tabular mt-0.5 font-medium text-primary">Fee: ₹{doc.consultationFee}</div>
                                )}
                              </div>
                              <Link href="/patient/login" className="rounded-md bg-primary px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-primary/90">
                                Book
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 border-t border-border pt-4 text-center">
                    <Link href="/patient/login" className="text-xs font-medium text-primary hover:underline">
                      Sign in as patient to book &rarr;
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
