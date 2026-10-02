export function Field({
  label,
  name,
  type,
  autoComplete,
  inputMode,
  placeholder,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete?: string;
  inputMode?: "numeric";
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="font-numeral text-sm">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        className="h-12 w-full rounded-lg border px-4 font-numeral text-base transition-colors duration-150 placeholder:text-[var(--faint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        style={{ backgroundColor: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
      />
    </div>
  );
}
