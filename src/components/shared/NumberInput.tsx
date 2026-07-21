import { useEffect, useRef, useState } from 'react';

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
  const [draftValue, setDraftValue] = useState(() => String(value));
  const isEditing = useRef(false);

  useEffect(() => {
    if (!isEditing.current) setDraftValue(String(value));
  }, [value]);

  const parseValidValue = (rawValue: string): number | null => {
    if (rawValue.trim() === '') return null;
    const parsed = Number(rawValue);
    return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
  };

  return (
    <label className="input-row">
      {/* <span>{label}</span> */}
      <span dangerouslySetInnerHTML={{ __html: label }} />
      <input
        type="number"
        value={draftValue}
        min={min}
        max={max}
        step={step}
        readOnly={readonly}
        className={selected ? 'selected' : ''}
        onFocus={() => {
          isEditing.current = true;
          setDraftValue(String(value));
        }}
        onChange={(event) => {
          const rawValue = event.target.value;
          setDraftValue(rawValue);
          const parsed = parseValidValue(rawValue);
          if (parsed !== null) onChange?.(parsed);
        }}
        onBlur={() => {
          isEditing.current = false;
          const parsed = parseValidValue(draftValue);
          if (parsed === null) {
            setDraftValue(String(value));
          } else {
            setDraftValue(String(parsed));
            onChange?.(parsed);
          }
        }}
      />
    </label>
  );
}
