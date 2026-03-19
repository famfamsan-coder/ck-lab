'use client'

import { useRef, useState, useCallback } from 'react'

interface VoiceTextareaProps {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  hint?: string
  required?: boolean
}

// Web Speech API の型（lib.dom に存在しない環境向け）
interface SRInstance {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SREvent) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
}
interface SREvent {
  results: { [i: number]: { [j: number]: { transcript: string }; isFinal: boolean }; length: number }
  resultIndex: number
}
type SRCtor = new () => SRInstance

function getSR(): SRCtor | null {
  if (typeof window === 'undefined') return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export default function VoiceTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  hint,
  required,
}: VoiceTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<SRInstance | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [speechSupported] = useState(() => getSR() !== null)
  const baseValueRef = useRef(value)

  const startListening = useCallback(() => {
    const SR = getSR()
    if (!SR) return

    recognitionRef.current?.abort()

    const rec = new SR()
    recognitionRef.current = rec
    rec.lang = 'ja-JP'
    rec.continuous = true
    rec.interimResults = true
    baseValueRef.current = value

    rec.onresult = (event: SREvent) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += t
        } else {
          interim += t
        }
      }
      if (final) {
        const sep = baseValueRef.current && !baseValueRef.current.endsWith('\n') ? '\n' : ''
        const newVal = baseValueRef.current + sep + final
        baseValueRef.current = newVal
        onChange(newVal)
        setInterimText('')
      } else {
        setInterimText(interim)
      }
    }

    rec.onerror = () => { setIsListening(false); setInterimText('') }
    rec.onend = () => { setIsListening(false); setInterimText('') }

    try {
      rec.start()
      setIsListening(true)
      setInterimText('')
      textareaRef.current?.focus()
    } catch {
      setIsListening(false)
    }
  }, [value, onChange])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
    setInterimText('')
  }, [])

  const displayValue = interimText
    ? value + (value && !value.endsWith('\n') ? '\n' : '') + interimText
    : value

  return (
    <div>
      <label className="form-label">
        {label}
        {required && <span style={{ color: '#b91c1c', marginLeft: 2 }}>*</span>}
      </label>
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={displayValue}
          onChange={(e) => { if (!isListening) onChange(e.target.value) }}
          placeholder={placeholder}
          rows={rows}
          className="form-textarea"
          style={{ paddingRight: 52, fontSize: 15, lineHeight: 1.7, minHeight: rows * 28 + 24 }}
          required={required}
          readOnly={isListening}
        />

        {/* 音声入力ボタン */}
        <button
          type="button"
          onClick={isListening ? stopListening : startListening}
          title={
            !speechSupported
              ? 'このブラウザは音声認識APIに非対応です。iPadのキーボード🎤ボタンをご利用ください'
              : isListening ? '音声入力を停止' : '音声入力を開始'
          }
          className="absolute top-2.5 right-2.5 flex items-center justify-center rounded transition-all"
          style={{
            width: 36, height: 36,
            backgroundColor: isListening ? '#D85A9A' : speechSupported ? '#f3f4f6' : '#f9fafb',
            border: `1px solid ${isListening ? '#e8a0cc' : '#e5e7eb'}`,
            cursor: speechSupported ? 'pointer' : 'default',
            touchAction: 'manipulation',
          }}
        >
          {isListening ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="15" height="15" fill="none" stroke={speechSupported ? '#374151' : '#d1d5db'} strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
        </button>

        {/* 中間テキスト表示 */}
        {isListening && interimText && (
          <div className="absolute bottom-2 left-3 right-12 text-sm pointer-events-none"
            style={{ color: '#9ca3af', fontStyle: 'italic' }}>
            {interimText}
          </div>
        )}
      </div>

      {/* ヒント */}
      {isListening ? (
        <p className="form-hint" style={{ color: '#D85A9A' }}>
          🔴 録音中… 話し終わったら右のボタンで停止
        </p>
      ) : hint ? (
        <p className="form-hint">{hint}</p>
      ) : speechSupported ? (
        <p className="form-hint">🎤 右のマイクボタンで音声入力できます（日本語対応）</p>
      ) : (
        <p className="form-hint">🎤 音声入力：iPadキーボードの🎤ボタン、またはiPadの音声入力機能をご利用ください</p>
      )}
    </div>
  )
}
