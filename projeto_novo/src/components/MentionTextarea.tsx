import React, { useState, useRef, useEffect, useCallback } from "react";
import { AthleteService, MentionedAthlete } from "../services/api";

interface MentionTextareaProps {
  value: string;
  onChange: (value: string, mentionedAthleteIds: string[]) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
}

function detectQuery(val: string, cursorPos: number): string | null {
  const text = val.slice(0, cursorPos);
  const match = text.match(/@([\w]{0,30})$/);
  return match ? match[1] : null;
}

const MentionTextarea: React.FC<MentionTextareaProps> = ({
  value,
  onChange,
  placeholder,
  maxLength,
  disabled,
  multiline = false,
  rows = 3,
  className = "",
  onKeyDown,
}) => {
  const inputRef = useRef<any>(null);
  const mentionedIdsRef = useRef<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query, setQuery] = useState<string | null>(null);
  const [results, setResults] = useState<MentionedAthlete[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [searching, setSearching] = useState(false);

  // Debounced search
  useEffect(() => {
    if (query === null || query.length === 0) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await AthleteService.search(query, 8);
        setResults(data.athletes);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const insertMention = useCallback(
    (athlete: MentionedAthlete) => {
      const el = inputRef.current;
      if (!el) return;
      const cursor = el.selectionStart ?? value.length;
      const before = value.slice(0, cursor);
      const after = value.slice(cursor);
      const match = before.match(/@([\w]{0,30})$/);
      if (!match) return;
      const token = athlete.nickname ?? athlete.fullName.split(" ")[0];
      const newBefore = before.slice(0, before.length - match[0].length) + `@${token} `;
      const newVal = newBefore + after;
      const truncated = maxLength ? newVal.slice(0, maxLength) : newVal;

      if (!mentionedIdsRef.current.includes(athlete.id)) {
        mentionedIdsRef.current = [...mentionedIdsRef.current, athlete.id];
      }

      setQuery(null);
      setResults([]);
      onChange(truncated, mentionedIdsRef.current);

      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const newCursor = newBefore.length;
          inputRef.current.setSelectionRange(newCursor, newCursor);
        }
      });
    },
    [value, maxLength, onChange],
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => {
    const raw = e.target.value;
    const newVal = maxLength ? raw.slice(0, maxLength) : raw;
    const cursor = e.target.selectionStart ?? newVal.length;
    const q = detectQuery(newVal, cursor);
    setQuery(q);
    setSelectedIdx(0);
    onChange(newVal, mentionedIdsRef.current);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => {
    if (query !== null && results.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        insertMention(results[selectedIdx]);
        return;
      }
      if (e.key === "Escape") {
        setQuery(null);
        setResults([]);
        return;
      }
    }
    onKeyDown?.(e);
  };

  const showDropdown = query !== null && query.length > 0 && (searching || results.length > 0);

  const sharedProps = {
    ref: inputRef,
    value,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    placeholder,
    disabled,
    className,
  };

  return (
    <div className="relative w-full">
      {multiline ? (
        <textarea {...sharedProps} rows={rows} />
      ) : (
        <input type="text" {...sharedProps} />
      )}

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {searching && results.length === 0 ? (
            <p className="text-[12px] text-gray-400 px-3 py-2">Buscando...</p>
          ) : (
            results.map((athlete, i) => (
              <button
                key={athlete.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(athlete);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                  i === selectedIdx ? "bg-gray-50" : "hover:bg-gray-50"
                }`}
              >
                {athlete.avatarUrl ? (
                  <img
                    src={athlete.avatarUrl}
                    alt=""
                    className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[9px] font-bold text-blue-600 flex-shrink-0">
                    {(athlete.nickname ?? athlete.fullName).slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-900 truncate">
                    {athlete.nickname ?? athlete.fullName}
                  </p>
                  {athlete.nickname && (
                    <p className="text-[11px] text-gray-400 truncate">{athlete.fullName}</p>
                  )}
                </div>
                {athlete.city && (
                  <span className="text-[11px] text-gray-400 flex-shrink-0">
                    {athlete.city}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default MentionTextarea;
