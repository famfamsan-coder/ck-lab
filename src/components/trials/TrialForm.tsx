'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { T } from '@/lib/supabase/constants'
import RatingSelect from '@/components/ui/RatingSelect'
import VoiceTextarea from '@/components/ui/VoiceTextarea'
import type { Trial, Evaluation, TrialStatus } from '@/types'
import { TRIAL_STATUSES } from '@/types'

interface TrialFormProps {
  menuId: string
  menuName: string
  trialId?: string
  initialTrial?: Trial
  initialEvaluation?: Evaluation | null
  nextVersion?: number
}

const THAW_METHODS = [
  '冷蔵庫解凍（4時間）',
  '冷蔵庫解凍（6時間）',
  '冷蔵庫解凍（8時間）',
  '冷蔵庫解凍（一晩）',
  '常温解凍',
  '流水解凍',
  '湯煎解凍',
  '電子レンジ解凍',
  '自然解凍不要（加熱調理）',
]

const REHEAT_METHODS = [
  'スチームコンベクション 85℃ 10分',
  'スチームコンベクション 85℃ 12分',
  'スチームコンベクション 85℃ 15分',
  'スチームコンベクション 80℃ 12分',
  'スチームコンベクション 80℃ 15分',
  'スチームコンベクション 90℃ 10分',
  'オーブン 180℃ 10分',
  '電子レンジ 2分',
  '電子レンジ 3分',
  '再沸騰まで加熱',
  '湯煎加熱',
  '解凍のみ（加熱不要）',
]

export default function TrialForm({
  menuId,
  menuName,
  trialId,
  initialTrial,
  initialEvaluation,
  nextVersion = 1,
}: TrialFormProps) {
  const router = useRouter()
  const isEdit = !!trialId

  const today = new Date().toISOString().slice(0, 10)
  const [trialDate, setTrialDate] = useState(initialTrial?.trial_date ?? today)
  const [trialist, setTrialist] = useState(initialTrial?.trialist ?? '')
  const [prepTime, setPrepTime] = useState(initialTrial?.prep_time?.toString() ?? '')
  const [cookTime, setCookTime] = useState(initialTrial?.cook_time?.toString() ?? '')
  const [coolTime, setCoolTime] = useState(initialTrial?.cool_time?.toString() ?? '')
  const [freezeTime, setFreezeTime] = useState(initialTrial?.freeze_time?.toString() ?? '')
  const [storageDays, setStorageDays] = useState(initialTrial?.storage_days?.toString() ?? '')
  const [thawMethod, setThawMethod] = useState(initialTrial?.thaw_method ?? '')
  const [reheatMethod, setReheatMethod] = useState(initialTrial?.reheat_method ?? '')
  const [freezeNotes, setFreezeNotes] = useState(initialTrial?.freeze_notes ?? '')
  const [reheatNotes, setReheatNotes] = useState(initialTrial?.reheat_notes ?? '')
  const [improvements, setImprovements] = useState(initialTrial?.improvements ?? '')
  const [nextTrialNotes, setNextTrialNotes] = useState(initialTrial?.next_trial_notes ?? '')
  const [status, setStatus] = useState<TrialStatus | ''>(initialTrial?.status ?? '')

  const [taste, setTaste] = useState<number | null>(initialEvaluation?.taste ?? null)
  const [appearance, setAppearance] = useState<number | null>(initialEvaluation?.appearance ?? null)
  const [texture, setTexture] = useState<number | null>(initialEvaluation?.texture ?? null)
  const [aroma, setAroma] = useState<number | null>(initialEvaluation?.aroma ?? null)
  const [wateriness, setWateriness] = useState<number | null>(initialEvaluation?.wateriness ?? null)
  const [discoloration, setDiscoloration] = useState<number | null>(initialEvaluation?.discoloration ?? null)
  const [shapeCollapse, setShapeCollapse] = useState<number | null>(initialEvaluation?.shape_collapse ?? null)
  const [servingEase, setServingEase] = useState<number | null>(initialEvaluation?.serving_ease ?? null)
  const [fieldReproducibility, setFieldReproducibility] = useState<number | null>(initialEvaluation?.field_reproducibility ?? null)
  const [overall, setOverall] = useState<number | null>(initialEvaluation?.overall ?? null)
  const [evaluator, setEvaluator] = useState(initialEvaluation?.evaluator ?? '')
  const [evaluationNotes, setEvaluationNotes] = useState(initialEvaluation?.evaluation_notes ?? '')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'trial' | 'eval' | 'notes'>('trial')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!trialist.trim()) { setError('担当者名を入力してください'); return }
    if (!trialDate) { setError('試作日を入力してください'); return }

    setLoading(true)
    setError('')
    const client = createClient()

    try {
      let tid = trialId

      if (isEdit) {
        const { error: trialErr } = await client.from(T.TRIALS).update({
          trial_date: trialDate,
          trialist: trialist.trim(),
          prep_time: prepTime ? parseInt(prepTime) : null,
          cook_time: cookTime ? parseInt(cookTime) : null,
          cool_time: coolTime ? parseInt(coolTime) : null,
          freeze_time: freezeTime ? parseInt(freezeTime) : null,
          storage_days: storageDays ? parseInt(storageDays) : null,
          thaw_method: thawMethod.trim() || null,
          reheat_method: reheatMethod.trim() || null,
          freeze_notes: freezeNotes.trim() || null,
          reheat_notes: reheatNotes.trim() || null,
          improvements: improvements.trim() || null,
          next_trial_notes: nextTrialNotes.trim() || null,
          status: status || null,
        }).eq('id', trialId)
        if (trialErr) throw trialErr
      } else {
        const { data: trial, error: trialErr } = await client.from(T.TRIALS).insert({
          menu_id: menuId,
          version: nextVersion,
          trial_date: trialDate,
          trialist: trialist.trim(),
          prep_time: prepTime ? parseInt(prepTime) : null,
          cook_time: cookTime ? parseInt(cookTime) : null,
          cool_time: coolTime ? parseInt(coolTime) : null,
          freeze_time: freezeTime ? parseInt(freezeTime) : null,
          storage_days: storageDays ? parseInt(storageDays) : null,
          thaw_method: thawMethod.trim() || null,
          reheat_method: reheatMethod.trim() || null,
          freeze_notes: freezeNotes.trim() || null,
          reheat_notes: reheatNotes.trim() || null,
          improvements: improvements.trim() || null,
          next_trial_notes: nextTrialNotes.trim() || null,
          status: status || null,
        }).select().single()
        if (trialErr) throw trialErr
        tid = trial.id
      }

      const hasEval = [taste, appearance, texture, aroma, wateriness, discoloration, shapeCollapse, servingEase, fieldReproducibility, overall].some(v => v != null)
      if (hasEval || evaluator || evaluationNotes) {
        const { error: evalErr } = await client.from(T.EVALUATIONS).upsert({
          trial_id: tid,
          taste, appearance, texture, aroma, wateriness, discoloration,
          shape_collapse: shapeCollapse, serving_ease: servingEase,
          field_reproducibility: fieldReproducibility, overall,
          evaluator: evaluator.trim() || null,
          evaluation_notes: evaluationNotes.trim() || null,
        }, { onConflict: 'trial_id' })
        if (evalErr) throw evalErr
      }

      router.push(`/menus/${menuId}`)
      router.refresh()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '保存に失敗しました'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const tabStyle = (tab: string): React.CSSProperties => ({
    padding: '10px 18px',
    fontSize: '14px',
    fontWeight: activeTab === tab ? 600 : 400,
    color: activeTab === tab ? '#111827' : '#6b7280',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    borderBottom: activeTab === tab ? '2px solid #6BAED6' : '2px solid transparent',
    transition: 'all 0.15s',
    fontFamily: 'inherit',
    touchAction: 'manipulation',
    minHeight: 48,
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">
      {error && (
        <div className="rounded-md p-3 text-sm" style={{ backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
          {error}
        </div>
      )}

      <div className="card">
        {/* タブ */}
        <div className="flex border-b px-4" style={{ borderColor: '#e5e7eb', gap: 0 }}>
          <button type="button" style={tabStyle('trial')} onClick={() => setActiveTab('trial')}>
            📋 試作情報
          </button>
          <button type="button" style={tabStyle('eval')} onClick={() => setActiveTab('eval')}>
            ⭐ 評価
          </button>
          <button type="button" style={tabStyle('notes')} onClick={() => setActiveTab('notes')}>
            📝 注意点・改善
          </button>
        </div>

        <div className="card-body">
          {/* ===== 試作情報タブ ===== */}
          {activeTab === 'trial' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">試作日 <span style={{ color: '#b91c1c' }}>*</span></label>
                  <input
                    type="date"
                    value={trialDate}
                    onChange={(e) => setTrialDate(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">担当者 <span style={{ color: '#b91c1c' }}>*</span></label>
                  <input
                    type="text"
                    value={trialist}
                    onChange={(e) => setTrialist(e.target.value)}
                    placeholder="例：山田太郎"
                    className="form-input"
                    required
                  />
                </div>
              </div>

              {!isEdit && (
                <div className="rounded-md px-4 py-3 text-sm"
                  style={{ backgroundColor: '#eef6fb', color: '#1d5878', border: '1px solid #9ecce6' }}>
                  試作バージョン: <strong>v{nextVersion}</strong>（自動採番）
                </div>
              )}

              {/* 工程時間 */}
              <div>
                <div className="section-title">工程時間（分）</div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: '仕込み時間', value: prepTime, setter: setPrepTime },
                    { label: '調理時間', value: cookTime, setter: setCookTime },
                    { label: '冷却時間', value: coolTime, setter: setCoolTime },
                    { label: '瞬間冷凍時間', value: freezeTime, setter: setFreezeTime },
                  ].map((item) => (
                    <div key={item.label}>
                      <label className="form-label">{item.label}</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={item.value}
                          onChange={(e) => item.setter(e.target.value)}
                          placeholder="0"
                          min={0}
                          className="form-input"
                          style={{ paddingRight: 32 }}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none" style={{ color: '#9ca3af' }}>分</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 保管日数 */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="form-label">冷凍保管日数</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={storageDays}
                      onChange={(e) => setStorageDays(e.target.value)}
                      placeholder="0"
                      min={0}
                      className="form-input"
                      style={{ paddingRight: 32 }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none" style={{ color: '#9ca3af' }}>日</span>
                  </div>
                </div>
              </div>

              {/* 解凍・再加熱 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">解凍方法</label>
                  <select value={thawMethod} onChange={(e) => setThawMethod(e.target.value)} className="form-select">
                    <option value="">選択してください</option>
                    {THAW_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                    <option value="__custom">その他（下に直接入力）</option>
                  </select>
                  {(!THAW_METHODS.includes(thawMethod) && thawMethod !== '') || thawMethod === '__custom' ? (
                    <input
                      type="text"
                      value={thawMethod === '__custom' ? '' : thawMethod}
                      onChange={(e) => setThawMethod(e.target.value)}
                      placeholder="解凍方法を入力してください"
                      className="form-input mt-2"
                    />
                  ) : null}
                </div>
                <div>
                  <label className="form-label">再加熱方法</label>
                  <select value={reheatMethod} onChange={(e) => setReheatMethod(e.target.value)} className="form-select">
                    <option value="">選択してください</option>
                    {REHEAT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                    <option value="__custom">その他（下に直接入力）</option>
                  </select>
                  {(!REHEAT_METHODS.includes(reheatMethod) && reheatMethod !== '') || reheatMethod === '__custom' ? (
                    <input
                      type="text"
                      value={reheatMethod === '__custom' ? '' : reheatMethod}
                      onChange={(e) => setReheatMethod(e.target.value)}
                      placeholder="再加熱方法を入力してください"
                      className="form-input mt-2"
                    />
                  ) : null}
                </div>
              </div>

              {/* 採用可否 */}
              <div>
                <label className="form-label">採用可否</label>
                <div className="flex flex-wrap gap-2">
                  {TRIAL_STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(status === s ? '' : s)}
                      className="status-badge"
                      style={{
                        padding: '10px 18px',
                        cursor: 'pointer',
                        touchAction: 'manipulation',
                        opacity: status && status !== s ? 0.4 : 1,
                        outline: status === s ? '2px solid #374151' : 'none',
                        outlineOffset: 2,
                        fontSize: 13,
                        minHeight: 44,
                      }}
                    >
                      {s}
                    </button>
                  ))}
                  {status && (
                    <button type="button" onClick={() => setStatus('')} className="btn btn-ghost btn-sm text-xs">
                      クリア
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===== 評価タブ ===== */}
          {activeTab === 'eval' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">評価者</label>
                  <input
                    type="text"
                    value={evaluator}
                    onChange={(e) => setEvaluator(e.target.value)}
                    placeholder="例：山田太郎"
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <div className="section-title">品質評価（1:不良 → 5:優秀）</div>
                <div className="grid grid-cols-2 gap-4">
                  <RatingSelect label="味の評価" value={taste} onChange={setTaste} />
                  <RatingSelect label="見た目の評価" value={appearance} onChange={setAppearance} />
                  <RatingSelect label="食感の評価" value={texture} onChange={setTexture} />
                  <RatingSelect label="香りの評価" value={aroma} onChange={setAroma} />
                </div>
              </div>

              <div>
                <div className="section-title">品質問題（1:なし → 5:深刻）</div>
                <p className="text-xs mb-3" style={{ color: '#9ca3af' }}>1が「問題なし」、5が「非常に深刻」</p>
                <div className="grid grid-cols-2 gap-4">
                  <RatingSelect label="水っぽさ" value={wateriness} onChange={setWateriness} reverse />
                  <RatingSelect label="変色" value={discoloration} onChange={setDiscoloration} reverse />
                  <RatingSelect label="型崩れ" value={shapeCollapse} onChange={setShapeCollapse} reverse />
                </div>
              </div>

              <div>
                <div className="section-title">運用評価（1:不良 → 5:優秀）</div>
                <div className="grid grid-cols-2 gap-4">
                  <RatingSelect label="提供しやすさ" value={servingEase} onChange={setServingEase} />
                  <RatingSelect label="現場再現性" value={fieldReproducibility} onChange={setFieldReproducibility} />
                </div>
              </div>

              <div>
                <div className="section-title">総合評価（1:不良 → 5:優秀）</div>
                <RatingSelect label="総合評価" value={overall} onChange={setOverall} />
              </div>

              <VoiceTextarea
                label="評価コメント"
                value={evaluationNotes}
                onChange={setEvaluationNotes}
                placeholder="評価の補足・気づきを音声または入力で記録してください（例：全体的には良好だが食感がやや軟らかい）"
                rows={5}
              />
            </div>
          )}

          {/* ===== 注意点・改善タブ ===== */}
          {activeTab === 'notes' && (
            <div className="space-y-6">
              <VoiceTextarea
                label="❄️ 冷凍時の注意点"
                value={freezeNotes}
                onChange={setFreezeNotes}
                placeholder="冷凍工程での注意点を入力してください（例：急速冷凍時に汁が漏れやすい、小分けにして冷凍する）"
                rows={4}
              />
              <VoiceTextarea
                label="🔥 再加熱時の注意点"
                value={reheatNotes}
                onChange={setReheatNotes}
                placeholder="再加熱時の注意点を入力してください（例：加熱しすぎると崩れる、蓋をして加熱する）"
                rows={4}
              />
              <VoiceTextarea
                label="🔧 改善点"
                value={improvements}
                onChange={setImprovements}
                placeholder="今回の試作で見つかった改善点を入力してください（例：調味料の量を調整する、盛り付けを変える）"
                rows={5}
              />
              <VoiceTextarea
                label="📝 次回試作への申し送り"
                value={nextTrialNotes}
                onChange={setNextTrialNotes}
                placeholder="次回試作時に試すべき変更点・引き継ぎ事項を入力してください（例：塩分を10%減らす、解凍時間を1時間短縮する）"
                rows={5}
              />
            </div>
          )}
        </div>
      </div>

      {/* ナビゲーション */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {activeTab !== 'trial' && (
            <button type="button" onClick={() => setActiveTab(activeTab === 'eval' ? 'trial' : 'eval')} className="btn btn-secondary">
              ← 前へ
            </button>
          )}
          {activeTab !== 'notes' && (
            <button type="button" onClick={() => setActiveTab(activeTab === 'trial' ? 'eval' : 'notes')} className="btn btn-secondary">
              次へ →
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn btn-primary btn-lg">
            {loading ? '保存中...' : isEdit ? '変更を保存' : '試作記録を登録'}
          </button>
          <button type="button" onClick={() => router.back()} className="btn btn-secondary btn-lg">
            キャンセル
          </button>
        </div>
      </div>
    </form>
  )
}
