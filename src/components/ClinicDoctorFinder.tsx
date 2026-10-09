'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { formatDoctorName } from '@/lib/utils'
import { IconSearch, IconBuilding } from '@/components/icons'

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
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedState, setSelectedState] = useState('Kerala')
  const [selectedDistrict, setSelectedDistrict] = useState('Thrissur')
  const [selectedArea, setSelectedArea] = useState('All')
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
      const matchSearch =
        !searchTerm ||
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.city || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchState = !selectedState || selectedState === 'All' || (c.state ?? 'Kerala') === selectedState
      const matchDistrict = !selectedDistrict || selectedDistrict === 'All' || (c.district ?? 'Thrissur') === selectedDistrict
      const matchArea = selectedArea === 'All' || c.city === selectedArea
      return matchSearch && matchState && matchDistrict && matchArea
    })
  }, [clinics, searchTerm, selectedState, selectedDistrict, selectedArea])

  const filteredClinicIds = new Set(filteredClinics.map((c) => c.id))

  const filteredDoctors = useMemo(() => {
    return doctors.filter((d) => {
      const tId = typeof d.tenant === 'object' && d.tenant !== null ? String(d.tenant.id) : String(d.tenant)
      const matchClinic = filteredClinicIds.has(tId)
      const matchSpecialty = selectedSpecialty === 'All' || d.specialty === selectedSpecialty
      const matchSearch =
        !searchTerm ||
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.specialty || '').toLowerCase().includes(searchTerm.toLowerCase())
      return matchClinic && matchSpecialty && matchSearch
    })
  }, [doctors, filteredClinicIds, selectedSpecialty, searchTerm])

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 space-y-8">
      {/* Search Header Banner */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 md:p-8 shadow-xs">
        <div className="text-center max-w-xl mx-auto mb-6">
          <span className="text-xs font-semibold tracking-wider text-primary uppercase">Find a Clinic or Doctor</span>
          <h2 className="mt-1.5 font-display text-2xl sm:text-3xl font-bold text-ink">
            Verified Doctors &amp; Outpatient Clinics
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
            Search by location, clinic name, or medical specialty to explore available consultation slots.
          </p>
        </div>

        {/* Search Bar Input */}
        <div className="relative max-w-2xl mx-auto mb-6">
          <IconSearch className="absolute start-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by location, clinic name, or doctor specialty..."
            className="w-full rounded-2xl border border-input bg-canvas ps-11 pe-4 py-3 text-sm font-medium text-ink outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-2xs"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">State</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full rounded-xl border border-input bg-canvas px-3 py-2 text-xs font-semibold text-ink outline-none focus:border-primary"
            >
              <option value="Kerala">Kerala</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="All">All States</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">District</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full rounded-xl border border-input bg-canvas px-3 py-2 text-xs font-semibold text-ink outline-none focus:border-primary"
            >
              <option value="Thrissur">Thrissur</option>
              <option value="Ernakulam">Ernakulam</option>
              <option value="Palakkad">Palakkad</option>
              <option value="All">All Districts</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">Location</label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full rounded-xl border border-input bg-canvas px-3 py-2 text-xs font-semibold text-ink outline-none focus:border-primary"
            >
              {areas.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">Specialty</label>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full rounded-xl border border-input bg-canvas px-3 py-2 text-xs font-semibold text-ink outline-none focus:border-primary"
            >
              {specialties.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Grid Cards (Matching Panel 5 in reference image) */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg font-bold text-ink">
            Available Clinics ({filteredClinics.length}) &amp; Specialists ({filteredDoctors.length})
          </h3>
        </div>

        {filteredClinics.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card p-12 text-center">
            <p className="text-sm font-semibold text-muted-foreground">No clinics match your selected filters.</p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('')
                setSelectedArea('All')
                setSelectedSpecialty('All')
              }}
              className="mt-3 text-xs font-semibold text-primary hover:underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredClinics.map((clinic) => {
              const clinicDocs = filteredDoctors.filter((d) => {
                const tId = typeof d.tenant === 'object' && d.tenant !== null ? String(d.tenant.id) : String(d.tenant)
                return tId === clinic.id
              })

              return (
                <div key={clinic.id} className="card-flat flex flex-col justify-between p-6 hover:border-primary/40 transition-all duration-150">
                  <div>
                    {/* Clinic Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary ring-1 ring-primary/20">
                          <IconBuilding size={18} />
                        </span>
                        <div>
                          <h4 className="font-display text-base font-bold text-ink">{clinic.name}</h4>
                          <p className="text-xs text-muted-foreground">{clinic.city || 'Thrissur'}, {clinic.state || 'Kerala'}</p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-md bg-secondary px-2 py-0.5 text-[11px] font-semibold text-primary">
                        ★ 4.8
                      </span>
                    </div>

                    {/* Doctors List inside Clinic Card */}
                    <div className="mt-5 border-t border-border/80 pt-4">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        Available Doctors ({clinicDocs.length})
                      </div>
                      {clinicDocs.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No doctors available in this specialty filter.</p>
                      ) : (
                        <ul className="space-y-2.5">
                          {clinicDocs.map((doc) => (
                            <li key={doc.id} className="rounded-xl border border-border/80 bg-canvas/60 p-3 text-xs space-y-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-bold text-ink">{formatDoctorName(doc.name)}</div>
                                  <div className="text-[11px] text-muted-foreground font-medium">{doc.specialty || 'General Physician'}</div>
                                </div>
                                <span className="tabular text-xs font-bold text-primary">₹{doc.consultationFee || 500}</span>
                              </div>
                              <div className="flex items-center justify-between pt-1 border-t border-border/40">
                                <span className="text-[10px] font-medium text-muted-foreground">
                                  Next available: <span className="font-semibold text-ink">Today, 11:30 AM</span>
                                </span>
                                <Link
                                  href={`/patient/login?doctor=${doc.id}`}
                                  className="rounded-lg bg-primary px-3 py-1 text-[11px] font-bold text-white shadow-2xs hover:bg-primary/90 transition-colors"
                                >
                                  Book Appointment
                                </Link>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
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
