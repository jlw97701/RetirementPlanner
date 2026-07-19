export function NumberInput({
  label,
  value,
  min = 0,
  max = 99999999,
  step = 1,
  readonly = false,
  selected = false,
  onChange = undefined
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  readonly?: boolean;
  selected?: boolean;
  onChange?: (v: number) => void;
}) {
  return (
    <label className="input-row">
      <span>{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        readOnly={readonly}
        className={selected ? 'selected' : ''}
        onChange={(e) => onChange?.(Number(e.target.value))}
      />
    </label>
  );
}
