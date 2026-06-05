import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Braces, Clock, Code, Copy, Palette, RotateCcw, Ruler, SwatchBook, Timer } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type ToolId = 'px-rem' | 'seconds-ms' | 'hex-rgb' | 'palette' | 'timestamp' | 'json'
type Accent = 'aqua' | 'honey' | 'leaf' | 'pink' | 'violet'

type Tool = {
  id: ToolId
  label: string
  short: string
  icon: LucideIcon
  accent: Accent
}

type SelectOption<T extends string> = {
  value: T
  label: string
}

const tools: Tool[] = [
  { id: 'px-rem', label: 'px / rem', short: 'CSS size', icon: Ruler, accent: 'aqua' },
  { id: 'seconds-ms', label: '秒 / ms', short: 'duration', icon: Timer, accent: 'honey' },
  { id: 'hex-rgb', label: 'HEX / RGB', short: 'color', icon: Palette, accent: 'pink' },
  { id: 'palette', label: 'パレット', short: 'contrast', icon: SwatchBook, accent: 'aqua' },
  { id: 'timestamp', label: 'Timestamp', short: 'Unix time', icon: Clock, accent: 'leaf' },
  { id: 'json', label: 'JSON整形', short: 'format', icon: Braces, accent: 'violet' },
]

const formatNumber = (value: number, maximumFractionDigits = 4) =>
  new Intl.NumberFormat('ja-JP', { maximumFractionDigits }).format(Number.isFinite(value) ? value : 0)

const toNumber = (value: string) => {
  const parsed = Number(value.replaceAll(',', ''))
  return Number.isFinite(parsed) ? parsed : 0
}

const pad2 = (value: number) => String(value).padStart(2, '0')

const toDateTimeInput = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(
    date.getMinutes(),
  )}`

async function copyText(text: string) {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  textarea.remove()
}

export default function App() {
  const [activeTool, setActiveTool] = useState<ToolId>('px-rem')
  const active = tools.find((tool) => tool.id === activeTool) ?? tools[0]
  const ActiveIcon = active.icon

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <img src="/icons/kumatan-192.png" alt="" className="brand-icon" />
          <div>
            <p className="eyebrow">Developer PWA</p>
            <h1>Kumatan Dev Tools</h1>
          </div>
        </div>
        <div className="header-badge">
          <Code aria-hidden="true" size={18} />
          <span>MVP</span>
        </div>
      </header>

      <nav className="bento-menu" aria-label="開発ツール">
        {tools.map((tool) => {
          const Icon = tool.icon
          return (
            <button
              className={`bento-item accent-${tool.accent}${tool.id === activeTool ? ' is-active' : ''}`}
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              type="button"
            >
              <Icon aria-hidden="true" size={22} />
              <span>{tool.label}</span>
              <small>{tool.short}</small>
            </button>
          )
        })}
      </nav>

      <main className={`workspace accent-${active.accent}`}>
        <section className="tool-heading">
          <div className="tool-title">
            <span className="tool-icon">
              <ActiveIcon aria-hidden="true" size={24} />
            </span>
            <div>
              <p>{active.short}</p>
              <h2>{active.label}</h2>
            </div>
          </div>
        </section>

        {activeTool === 'px-rem' && <PxRemTool />}
        {activeTool === 'seconds-ms' && <SecondsMsTool />}
        {activeTool === 'hex-rgb' && <HexRgbTool />}
        {activeTool === 'palette' && <PaletteTool />}
        {activeTool === 'timestamp' && <TimestampTool />}
        {activeTool === 'json' && <JsonTool />}
      </main>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  )
}

function NumberField({
  label,
  value,
  onChange,
  suffix,
  min,
  max,
  step = 'any',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  suffix?: string
  min?: string
  max?: string
  step?: string
}) {
  return (
    <Field label={label}>
      <span className="input-with-unit">
        <input
          inputMode="decimal"
          max={max}
          min={min}
          onChange={(event) => onChange(event.target.value)}
          step={step}
          type="number"
          value={value}
        />
        {suffix && <span>{suffix}</span>}
      </span>
    </Field>
  )
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: SelectOption<T>[]
  onChange: (value: T) => void
}) {
  return (
    <Field label={label}>
      <select onChange={(event) => onChange(event.target.value as T)} value={value}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  )
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: SelectOption<T>[]
  onChange: (value: T) => void
}) {
  return (
    <div className="segmented-field">
      <span>{label}</span>
      <div className="segmented-control">
        {options.map((option) => (
          <button
            className={option.value === value ? 'is-active' : ''}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function ResultPanel({
  title,
  primary,
  details,
  copyValue,
  children,
}: {
  title: string
  primary: string
  details?: string[]
  copyValue?: string
  children?: ReactNode
}) {
  const [copied, setCopied] = useState(false)
  const text = copyValue ?? [primary, ...(details ?? [])].join('\n')

  const handleCopy = async () => {
    await copyText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  return (
    <aside className="result-panel" aria-live="polite">
      <div>
        <p className="result-title">{title}</p>
        <strong>{primary}</strong>
      </div>
      {details && (
        <ul>
          {details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      )}
      {children}
      <button className="copy-button" onClick={handleCopy} title="コピー" type="button">
        <Copy aria-hidden="true" size={18} />
        {copied ? 'コピー済み' : 'コピー'}
      </button>
    </aside>
  )
}

function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="reset-button" onClick={onClick} title="リセット" type="button">
      <RotateCcw aria-hidden="true" size={18} />
      リセット
    </button>
  )
}

type PxRemMode = 'px-to-rem' | 'rem-to-px'

const pxRemOptions: SelectOption<PxRemMode>[] = [
  { value: 'px-to-rem', label: 'px → rem' },
  { value: 'rem-to-px', label: 'rem → px' },
]

function PxRemTool() {
  const [mode, setMode] = useState<PxRemMode>('px-to-rem')
  const [value, setValue] = useState('16')
  const [base, setBase] = useState('16')

  const result = useMemo(() => {
    const amount = toNumber(value)
    const basePx = Math.max(1, toNumber(base))
    const converted = mode === 'px-to-rem' ? amount / basePx : amount * basePx
    const suffix = mode === 'px-to-rem' ? 'rem' : 'px'
    return { amount, basePx, converted, suffix }
  }, [base, mode, value])

  return (
    <div className="tool-grid">
      <div className="form-stack">
        <Segmented label="方向" onChange={setMode} options={pxRemOptions} value={mode} />
        <div className="field-grid">
          <NumberField label="値" onChange={setValue} value={value} />
          <NumberField label="基準フォントサイズ" min="1" onChange={setBase} suffix="px" value={base} />
        </div>
        <ResetButton
          onClick={() => {
            setMode('px-to-rem')
            setValue('16')
            setBase('16')
          }}
        />
      </div>
      <ResultPanel
        details={[`入力: ${formatNumber(result.amount)} ${mode === 'px-to-rem' ? 'px' : 'rem'}`, `基準: ${formatNumber(result.basePx)}px`]}
        primary={`${formatNumber(result.converted)}${result.suffix}`}
        title="変換結果"
      />
    </div>
  )
}

type SecondsMode = 'seconds-to-ms' | 'ms-to-seconds'

const secondsOptions: SelectOption<SecondsMode>[] = [
  { value: 'seconds-to-ms', label: '秒 → ms' },
  { value: 'ms-to-seconds', label: 'ms → 秒' },
]

function SecondsMsTool() {
  const [mode, setMode] = useState<SecondsMode>('seconds-to-ms')
  const [value, setValue] = useState('1')
  const amount = toNumber(value)
  const converted = mode === 'seconds-to-ms' ? amount * 1000 : amount / 1000
  const suffix = mode === 'seconds-to-ms' ? 'ms' : '秒'

  return (
    <div className="tool-grid">
      <div className="form-stack">
        <Segmented label="方向" onChange={setMode} options={secondsOptions} value={mode} />
        <NumberField label="値" min="0" onChange={setValue} value={value} />
        <ResetButton
          onClick={() => {
            setMode('seconds-to-ms')
            setValue('1')
          }}
        />
      </div>
      <ResultPanel
        details={[`入力: ${formatNumber(amount)} ${mode === 'seconds-to-ms' ? '秒' : 'ms'}`]}
        primary={`${formatNumber(converted)}${suffix}`}
        title="変換結果"
      />
    </div>
  )
}

type ColorMode = 'hex-to-rgb' | 'rgb-to-hex'

const colorOptions: SelectOption<ColorMode>[] = [
  { value: 'hex-to-rgb', label: 'HEX → RGB' },
  { value: 'rgb-to-hex', label: 'RGB → HEX' },
]

function normalizeHex(value: string) {
  const cleaned = value.trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
    return cleaned
      .split('')
      .map((char) => `${char}${char}`)
      .join('')
      .toUpperCase()
  }
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return cleaned.toUpperCase()
  }
  return ''
}

function clampRgb(value: string) {
  return Math.min(255, Math.max(0, Math.round(toNumber(value))))
}

function toHexPart(value: number) {
  return value.toString(16).padStart(2, '0').toUpperCase()
}

type Rgb = {
  r: number
  g: number
  b: number
}

function hexToRgb(value: string): Rgb | null {
  const normalized = normalizeHex(value)
  if (!normalized) {
    return null
  }

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  }
}

function rgbToHex({ r, g, b }: Rgb) {
  return `#${toHexPart(r)}${toHexPart(g)}${toHexPart(b)}`
}

function mixRgb(from: Rgb, to: Rgb, amount: number): Rgb {
  return {
    r: Math.round(from.r + (to.r - from.r) * amount),
    g: Math.round(from.g + (to.g - from.g) * amount),
    b: Math.round(from.b + (to.b - from.b) * amount),
  }
}

function relativeLuminance({ r, g, b }: Rgb) {
  const convert = (channel: number) => {
    const value = channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }

  return 0.2126 * convert(r) + 0.7152 * convert(g) + 0.0722 * convert(b)
}

function contrastRatio(background: Rgb, foreground: Rgb) {
  const bg = relativeLuminance(background)
  const fg = relativeLuminance(foreground)
  const lighter = Math.max(bg, fg)
  const darker = Math.min(bg, fg)
  return (lighter + 0.05) / (darker + 0.05)
}

const paletteSteps = [
  { label: '50', target: { r: 255, g: 255, b: 255 }, amount: 0.92 },
  { label: '100', target: { r: 255, g: 255, b: 255 }, amount: 0.84 },
  { label: '200', target: { r: 255, g: 255, b: 255 }, amount: 0.68 },
  { label: '300', target: { r: 255, g: 255, b: 255 }, amount: 0.48 },
  { label: '400', target: { r: 255, g: 255, b: 255 }, amount: 0.24 },
  { label: '500', target: null, amount: 0 },
  { label: '600', target: { r: 0, g: 0, b: 0 }, amount: 0.14 },
  { label: '700', target: { r: 0, g: 0, b: 0 }, amount: 0.3 },
  { label: '800', target: { r: 0, g: 0, b: 0 }, amount: 0.46 },
  { label: '900', target: { r: 0, g: 0, b: 0 }, amount: 0.62 },
]

function createPalette(base: Rgb) {
  const white = { r: 255, g: 255, b: 255 }
  const black = { r: 0, g: 0, b: 0 }

  return paletteSteps.map((step) => {
    const rgb = step.target ? mixRgb(base, step.target, step.amount) : base
    const hex = rgbToHex(rgb)
    const whiteContrast = contrastRatio(rgb, white)
    const blackContrast = contrastRatio(rgb, black)
    const recommended = blackContrast >= whiteContrast ? '黒文字' : '白文字'

    return {
      ...step,
      rgb,
      hex,
      whiteContrast,
      blackContrast,
      recommended,
    }
  })
}

function HexRgbTool() {
  const [mode, setMode] = useState<ColorMode>('hex-to-rgb')
  const [hex, setHex] = useState('#8EE8EE')
  const [red, setRed] = useState('142')
  const [green, setGreen] = useState('232')
  const [blue, setBlue] = useState('238')

  const result = useMemo(() => {
    if (mode === 'hex-to-rgb') {
      const normalized = normalizeHex(hex)
      if (!normalized) {
        return { valid: false, primary: 'Invalid HEX', details: ['#RGB または #RRGGBB を入力'] }
      }
      const r = parseInt(normalized.slice(0, 2), 16)
      const g = parseInt(normalized.slice(2, 4), 16)
      const b = parseInt(normalized.slice(4, 6), 16)
      return {
        valid: true,
        primary: `rgb(${r}, ${g}, ${b})`,
        details: [`HEX: #${normalized}`, `R: ${r}`, `G: ${g}`, `B: ${b}`],
      }
    }

    const r = clampRgb(red)
    const g = clampRgb(green)
    const b = clampRgb(blue)
    const nextHex = `#${toHexPart(r)}${toHexPart(g)}${toHexPart(b)}`
    return {
      valid: true,
      primary: nextHex,
      details: [`RGB: ${r}, ${g}, ${b}`, `CSS: rgb(${r}, ${g}, ${b})`],
    }
  }, [blue, green, hex, mode, red])

  return (
    <div className="tool-grid">
      <div className="form-stack">
        <Segmented label="方向" onChange={setMode} options={colorOptions} value={mode} />
        {mode === 'hex-to-rgb' ? (
          <Field label="HEX">
            <input onChange={(event) => setHex(event.target.value)} spellCheck={false} type="text" value={hex} />
          </Field>
        ) : (
          <div className="field-grid three">
            <NumberField label="R" max="255" min="0" onChange={setRed} value={red} />
            <NumberField label="G" max="255" min="0" onChange={setGreen} value={green} />
            <NumberField label="B" max="255" min="0" onChange={setBlue} value={blue} />
          </div>
        )}
        <ResetButton
          onClick={() => {
            setMode('hex-to-rgb')
            setHex('#8EE8EE')
            setRed('142')
            setGreen('232')
            setBlue('238')
          }}
        />
      </div>
      <ResultPanel
        copyValue={result.valid ? result.primary : ''}
        details={result.details}
        primary={result.primary}
        title="変換結果"
      >
        {result.valid && <span className="color-swatch" style={{ background: result.primary.startsWith('#') ? result.primary : hex }} />}
      </ResultPanel>
    </div>
  )
}

function PaletteTool() {
  const [baseColor, setBaseColor] = useState('#8EEEFF')
  const baseRgb = useMemo(() => hexToRgb(baseColor), [baseColor])
  const palette = useMemo(() => (baseRgb ? createPalette(baseRgb) : []), [baseRgb])

  return (
    <div className="palette-tool">
      <div className="form-stack">
        <div className="field-grid">
          <Field label="ベースカラー">
            <input onChange={(event) => setBaseColor(event.target.value)} spellCheck={false} type="text" value={baseColor} />
          </Field>
          <Field label="色見本">
            <span className="base-color-preview" style={{ background: baseRgb ? rgbToHex(baseRgb) : '#fff1f5' }} />
          </Field>
        </div>
        <ResetButton onClick={() => setBaseColor('#8EEEFF')} />
      </div>

      {!baseRgb && (
        <ResultPanel details={['#RGB または #RRGGBB を入力してね']} primary="Invalid HEX" title="パレット" />
      )}

      {baseRgb && (
        <section className="palette-grid" aria-label="生成されたカラーパレット">
          {palette.map((color) => (
            <PaletteCard
              blackContrast={color.blackContrast}
              hex={color.hex}
              key={color.label}
              label={color.label}
              recommended={color.recommended}
              whiteContrast={color.whiteContrast}
            />
          ))}
        </section>
      )}
    </div>
  )
}

function PaletteCard({
  label,
  hex,
  whiteContrast,
  blackContrast,
  recommended,
}: {
  label: string
  hex: string
  whiteContrast: number
  blackContrast: number
  recommended: string
}) {
  const [copied, setCopied] = useState<'hex' | 'css' | null>(null)
  const cssVariable = `--color-primary-${label}: ${hex};`

  const handleCopy = async (type: 'hex' | 'css') => {
    await copyText(type === 'hex' ? hex : cssVariable)
    setCopied(type)
    window.setTimeout(() => setCopied(null), 1200)
  }

  return (
    <article className="palette-card">
      <div className="palette-swatch" style={{ background: hex }}>
        <span>{label}</span>
      </div>
      <div className="palette-card-body">
        <div className="palette-card-head">
          <div>
            <p>{label}</p>
            <strong>{hex}</strong>
          </div>
          <button className="mini-copy" onClick={() => handleCopy('hex')} type="button">
            {copied === 'hex' ? 'Copied' : 'HEX'}
          </button>
        </div>

        <div className="text-preview-grid">
          <div className="text-preview" style={{ background: hex, color: '#fff' }}>
            白文字
          </div>
          <div className="text-preview" style={{ background: hex, color: '#000' }}>
            黒文字
          </div>
        </div>

        <dl className="contrast-list">
          <div>
            <dt>白文字</dt>
            <dd>{formatNumber(whiteContrast, 2)}</dd>
          </div>
          <div>
            <dt>黒文字</dt>
            <dd>{formatNumber(blackContrast, 2)}</dd>
          </div>
          <div>
            <dt>おすすめ</dt>
            <dd>{recommended}</dd>
          </div>
        </dl>

        <button className="css-copy" onClick={() => handleCopy('css')} type="button">
          {copied === 'css' ? 'CSS変数コピー済み' : 'CSS変数をコピー'}
        </button>
      </div>
    </article>
  )
}

type TimestampMode = 'unix-to-date' | 'date-to-unix'
type TimestampUnit = 'seconds' | 'milliseconds'

const timestampOptions: SelectOption<TimestampMode>[] = [
  { value: 'unix-to-date', label: 'Unix → 日時' },
  { value: 'date-to-unix', label: '日時 → Unix' },
]

const timestampUnitOptions: SelectOption<TimestampUnit>[] = [
  { value: 'seconds', label: '秒' },
  { value: 'milliseconds', label: 'ms' },
]

function TimestampTool() {
  const now = new Date()
  const [mode, setMode] = useState<TimestampMode>('unix-to-date')
  const [unit, setUnit] = useState<TimestampUnit>('seconds')
  const [timestamp, setTimestamp] = useState(String(Math.floor(now.getTime() / 1000)))
  const [dateTime, setDateTime] = useState(toDateTimeInput(now))

  const result = useMemo(() => {
    if (mode === 'unix-to-date') {
      const raw = toNumber(timestamp)
      const ms = unit === 'seconds' ? raw * 1000 : raw
      const date = new Date(ms)
      if (!Number.isFinite(date.getTime())) {
        return { primary: 'Invalid time', details: ['Unix timestampを確認してね'], copyValue: '' }
      }
      return {
        primary: date.toLocaleString('ja-JP'),
        details: [`ISO: ${date.toISOString()}`, `Local: ${toDateTimeInput(date)}`],
        copyValue: date.toISOString(),
      }
    }

    const date = new Date(dateTime)
    if (!Number.isFinite(date.getTime())) {
      return { primary: 'Invalid date', details: ['日時を確認してね'], copyValue: '' }
    }
    const ms = date.getTime()
    const unix = unit === 'seconds' ? Math.floor(ms / 1000) : ms
    return {
      primary: String(unix),
      details: [`Local: ${date.toLocaleString('ja-JP')}`, `ISO: ${date.toISOString()}`],
      copyValue: String(unix),
    }
  }, [dateTime, mode, timestamp, unit])

  return (
    <div className="tool-grid">
      <div className="form-stack">
        <Segmented label="方向" onChange={setMode} options={timestampOptions} value={mode} />
        <SelectField label="単位" onChange={setUnit} options={timestampUnitOptions} value={unit} />
        {mode === 'unix-to-date' ? (
          <NumberField label="Unix timestamp" onChange={setTimestamp} value={timestamp} />
        ) : (
          <Field label="日時">
            <input onChange={(event) => setDateTime(event.target.value)} type="datetime-local" value={dateTime} />
          </Field>
        )}
        <ResetButton
          onClick={() => {
            const fresh = new Date()
            setMode('unix-to-date')
            setUnit('seconds')
            setTimestamp(String(Math.floor(fresh.getTime() / 1000)))
            setDateTime(toDateTimeInput(fresh))
          }}
        />
      </div>
      <ResultPanel copyValue={result.copyValue} details={result.details} primary={result.primary} title="変換結果" />
    </div>
  )
}

function JsonTool() {
  const [input, setInput] = useState('{"kumatan":true,"tools":["px-rem","json"],"count":5}')

  const result = useMemo(() => {
    try {
      const parsed = JSON.parse(input)
      const formatted = JSON.stringify(parsed, null, 2)
      const compact = JSON.stringify(parsed)
      return {
        valid: true,
        primary: 'Valid JSON',
        formatted,
        details: [`整形後: ${formatted.length}文字`, `圧縮時: ${compact.length}文字`],
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'JSON parse error'
      return {
        valid: false,
        primary: 'Invalid JSON',
        formatted: message,
        details: ['構文を確認してね'],
      }
    }
  }, [input])

  return (
    <div className="tool-grid">
      <div className="form-stack">
        <Field label="JSON">
          <textarea onChange={(event) => setInput(event.target.value)} spellCheck={false} value={input} />
        </Field>
        <ResetButton onClick={() => setInput('{"kumatan":true,"tools":["px-rem","json"],"count":5}')} />
      </div>
      <ResultPanel
        copyValue={result.valid ? result.formatted : ''}
        details={result.details}
        primary={result.primary}
        title="整形結果"
      >
        <pre className={result.valid ? 'code-output' : 'code-output is-error'}>{result.formatted}</pre>
      </ResultPanel>
    </div>
  )
}
