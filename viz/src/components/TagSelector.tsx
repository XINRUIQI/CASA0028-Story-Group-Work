"use client";

interface TagSelectorProps<T extends string> {
  options: { value: T; label: string }[];
  selected: T[];
  onChange: (selected: T[]) => void;
  multiple?: boolean;
}

export default function TagSelector<T extends string>({
  options,
  selected,
  onChange,
  multiple = true,
}: TagSelectorProps<T>) {
  const toggle = (value: T) => {
    if (multiple) {
      if (selected.includes(value)) {
        onChange(selected.filter((s) => s !== value));
      } else {
        onChange([...selected, value]);
      }
    } else {
      onChange(selected.includes(value) ? [] : [value]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => toggle(opt.value)}
          className={`tag ${selected.includes(opt.value) ? "active" : ""}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
