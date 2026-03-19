import Link from 'next/link'
import { notFound } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import { createClient } from '@/lib/supabase/server'
import { T } from '@/lib/supabase/constants'
import TrialForm from '@/components/trials/TrialForm'

interface PageProps {
  params: Promise<{ id: string; trialId: string }>
}

export default async function EditTrialPage({ params }: PageProps) {
  const { id, trialId } = await params
  const client = await createClient()

  const [menuRes, trialRes] = await Promise.all([
    client.from(T.MENUS).select('id, name').eq('id', id).single(),
    client.from(T.TRIALS).select(`*, evaluations:${T.EVALUATIONS}(*)`).eq('id', trialId).single(),
  ])

  if (menuRes.error || !menuRes.data) notFound()
  if (trialRes.error || !trialRes.data) notFound()

  const safeMenu = menuRes.data!
  const trial = trialRes.data
  const evaluation = Array.isArray(trial.evaluations) ? trial.evaluations[0] : trial.evaluations

  const header = (
    <div className="flex items-center gap-3 py-3">
      <Link href={`/menus/${id}`} className="btn btn-ghost btn-sm p-1.5">
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
      </Link>
      <div>
        <h1 className="text-base font-semibold" style={{ color: '#111827' }}>試作記録 編集</h1>
        <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
          {safeMenu.name} — v{trial.version}
        </p>
      </div>
    </div>
  )

  return (
    <AppLayout header={header}>
      <div className="fade-in">
        <TrialForm
          menuId={id}
          menuName={safeMenu.name}
          trialId={trialId}
          initialTrial={trial}
          initialEvaluation={evaluation ?? null}
        />
      </div>
    </AppLayout>
  )
}
