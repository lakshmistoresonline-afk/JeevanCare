export async function GET(req: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params
  if (type === 'clinics') {
    const csv = 'name,phone,city,state,currency\n"JeevanCare Delhi Clinic","+919811111111","New Delhi","Delhi","INR"\n'
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="jeevancare-clinics-template.csv"',
      },
    })
  }
  if (type === 'staff') {
    const csv = 'name,email,password,role,phone,specialty,fee,regno\n"Dr. Ramesh Kumar","dr.ramesh@jeevancare.test","Test@123","doctor","+919822222222","General Medicine","500","SMC-99999"\n'
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="jeevancare-staff-template.csv"',
      },
    })
  }
  return Response.json({ error: 'Unknown template type.' }, { status: 404 })
}
