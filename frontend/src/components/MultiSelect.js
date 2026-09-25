import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';

export const MultiSelect = ({ options, value = [], onChange, placeholder = 'Select...', label }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggle = (opt) => {
    if (value.includes(opt)) onChange(value.filter(v => v !== opt));
    else onChange([...value, opt]);
  };

  return (
    <div ref={ref} className="relative">
      {label && <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-[#94A3B8]">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="neo-input w-full flex items-center justify-between gap-2 text-left min-h-[44px]"
        data-testid="multi-select-trigger"
      >
        <div className="flex-1 flex flex-wrap gap-1 min-w-0">
          {value.length === 0 ? (
            <span className="text-[#94A3B8] text-sm">{placeholder}</span>
          ) : (
            value.map(v => (
              <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#A855F7]/20 text-[#A855F7] rounded-md text-xs font-medium">
                {v}
                <X size={10} strokeWidth={3} onClick={(e) => { e.stopPropagation(); toggle(v); }} className="cursor-pointer hover:text-white" />
              </span>
            ))
          )}
        </div>
        <ChevronDown size={16} className={`text-[#94A3B8] flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-[#1E293B] border border-white/[0.1] rounded-xl shadow-2xl max-h-48 overflow-y-auto">
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-white/[0.06] transition-colors ${value.includes(opt) ? 'text-[#A855F7]' : 'text-[#CBD5E1]'}`}
              data-testid={`multi-select-option-${opt}`}
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${value.includes(opt) ? 'bg-[#A855F7] border-[#A855F7]' : 'border-white/[0.2]'}`}>
                {value.includes(opt) && <Check size={10} strokeWidth={3} className="text-white" />}
              </div>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
