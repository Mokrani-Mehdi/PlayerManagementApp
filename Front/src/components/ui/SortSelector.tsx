import { useState } from "react";
import { SortAsc, ChevronDown } from "lucide-react";
import type { SortKey } from "../../types";
import "./SortSelector.css";

export function SortSelector({ value, onChange, options }: {
  value: SortKey;
  onChange: (key: SortKey) => void;
  options: { value: SortKey; label: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const currentLabel = options.find((o) => o.value === value)?.label || "Trier";

  return (
    <div className="sort-selector">
      <button className="sort-selector-trigger" onClick={() => setIsOpen(!isOpen)}>
        <SortAsc size={14} />
        <span>{currentLabel}</span>
        <ChevronDown size={14} className={`sort-chevron ${isOpen ? "open" : ""}`} />
      </button>
      {isOpen && (
        <div className="sort-dropdown">
          {options.map((opt) => (
            <button
              key={opt.value}
              className={`sort-dropdown-item ${value === opt.value ? "active" : ""}`}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
            >
              {opt.label}
              {value === opt.value && <span className="sort-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
