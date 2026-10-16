import { useRef, useState } from "react";

/**
 * Hidden file picker → reads text → onText(csvString, fileName).
 * Pass busy / busyLabel while the parent is writing rows to the API.
 */
export default function CsvImportButton({
  label = "Import CSV",
  hint,
  disabled = false,
  busy = false,
  busyLabel = "Importing…",
  onText,
  className = "btn ghost",
}) {
  const inputRef = useRef(null);
  const [reading, setReading] = useState(false);
  const blocked = disabled || busy || reading;

  function pick() {
    if (blocked) return;
    inputRef.current?.click();
  }

  function onChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setReading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await onText?.(String(reader.result ?? ""), file.name);
      } finally {
        setReading(false);
      }
    };
    reader.onerror = () => {
      setReading(false);
      onText?.("", file.name);
    };
    reader.readAsText(file);
  }

  const showBusy = busy || reading;
  const buttonLabel = busy ? busyLabel : reading ? "Reading CSV…" : label;

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        tabIndex={-1}
        onChange={onChange}
      />
      <button
        type="button"
        className={className}
        disabled={blocked}
        onClick={pick}
        title={hint}
        aria-busy={showBusy || undefined}
      >
        {buttonLabel}
      </button>
    </>
  );
}
