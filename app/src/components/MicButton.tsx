interface Props {
  listening: boolean
  disabled?: boolean
  onPress: () => void
  size?: 'md' | 'lg'
}

/** ปุ่ม tap-to-talk: กดเพื่อพูด กดซ้ำเพื่อหยุด — โชว์ waveform ตอนกำลังฟัง */
export default function MicButton({ listening, disabled, onPress, size = 'lg' }: Props) {
  const dim = size === 'lg' ? 'h-16 w-16' : 'h-12 w-12'
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      aria-label={listening ? 'หยุดฟัง' : 'กดเพื่อพูด'}
      className={`${dim} flex items-center justify-center rounded-full shadow-lg transition active:scale-95 disabled:opacity-40 ${
        listening ? 'bg-red-500 talking-ring' : 'bg-bee-400'
      }`}
    >
      {listening ? (
        <div className="flex h-6 items-end gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="wave-bar w-1 rounded-full bg-white"
              style={{ height: '100%', animationDelay: `${i * 0.12}s` }}
            />
          ))}
        </div>
      ) : (
        <svg viewBox="0 0 24 24" className="h-7 w-7 fill-navy-900">
          <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" />
          <path d="M18 11a1 1 0 1 0-2 0 4 4 0 1 1-8 0 1 1 0 1 0-2 0 6 6 0 0 0 5 5.92V19h-2a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-2.08A6 6 0 0 0 18 11Z" />
        </svg>
      )}
    </button>
  )
}
