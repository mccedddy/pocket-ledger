type Option<T extends string> = { value: T; label: string }

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string
  value: T
  options: readonly Option<T>[]
  onChange: (value: T) => void
  disabled?: boolean
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex rounded-control border border-border bg-surface-subtle p-1"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={`min-h-8 rounded-[calc(var(--radius-control)-2px)] px-4 text-sm font-medium transition-colors disabled:opacity-50 ${
            value === option.value ? 'bg-primary-soft text-primary' : 'text-muted hover:text-text'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
