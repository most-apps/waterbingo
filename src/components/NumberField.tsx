import { useId, useState } from "react";

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  onCommit: (value: number) => void;
}

/** Number input that lets people clear and retype; commits only valid values. */
export default function NumberField({ label, value, min, max, onCommit }: Props) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  const [synced, setSynced] = useState(value);

  // Pick up outside changes (e.g. the URL) without an effect.
  if (value !== synced) {
    setSynced(value);
    setDraft(String(value));
  }

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        className="input"
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          const n = Number(e.target.value);
          if (e.target.value !== "" && Number.isInteger(n) && n >= min && n <= max) onCommit(n);
        }}
        onBlur={() => setDraft(String(value))}
      />
    </div>
  );
}
