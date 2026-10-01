import { useEffect, useId, useRef, useState } from 'react';

export function AutocompleteInput({
  id,
  value,
  onChange,
  onPickSuggestion,
  suggestions,
  placeholder,
  autoFocus = true,
  onCommit,
}) {
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listId = `${inputId}-listbox`;
  const showList = open && suggestions.length > 0;
  const activeDescendant =
    showList && highlightIndex >= 0
      ? `${listId}-option-${highlightIndex}`
      : undefined;

  useEffect(() => {
    setHighlightIndex(-1);
  }, [suggestions]);

  useEffect(() => {
    if (!autoFocus) return;
    const isCoarse = window.matchMedia('(pointer: coarse)').matches;
    if (!isCoarse) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (!showList) return undefined;
    const input = inputRef.current;
    const viewport = window.visualViewport;

    function placeList() {
      if (!input) return;
      const coarse = window.matchMedia('(pointer: coarse)').matches;
      if (!coarse) return;
      const view = window.visualViewport;
      const offset = view ? view.offsetTop : 0;
      const height = view ? view.height : window.innerHeight;
      const rect = input.getBoundingClientRect();
      const inputTop = rect.top - offset;
      const inputBottom = rect.bottom - offset;
      const space = height - inputBottom;
      if (space < 180) {
        const shift = Math.min(Math.max(0, inputTop - 8), 180 - space);
        if (shift > 4) window.scrollBy(0, shift);
      }

      const list = listRef.current;
      if (!list) return;
      const nextRect = input.getBoundingClientRect();
      const nextBottom = nextRect.bottom - offset;
      const nextSpace = height - nextBottom - 10;
      list.style.maxHeight = `${Math.max(140, Math.min(nextSpace, 320))}px`;
    }

    placeList();
    const later = window.setTimeout(placeList, 300);
    viewport?.addEventListener('resize', placeList);
    viewport?.addEventListener('scroll', placeList);
    return () => {
      window.clearTimeout(later);
      viewport?.removeEventListener('resize', placeList);
      viewport?.removeEventListener('scroll', placeList);
    };
  }, [showList, suggestions.length]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
        setHighlightIndex(-1);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      if (suggestions.length === 0) return;
      setHighlightIndex((index) => {
        if (index < 0) return 0;
        return Math.min(index + 1, suggestions.length - 1);
      });
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (suggestions.length === 0) return;
      setHighlightIndex((index) => (index <= 0 ? -1 : index - 1));
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      setHighlightIndex(-1);
      return;
    }

    if (event.key === 'Enter' && showList && highlightIndex >= 0) {
      event.preventDefault();
      chooseSuggestion(suggestions[highlightIndex]);
      return;
    }

    if (event.key === 'Enter' && onCommit) {
      event.preventDefault();
      onCommit(value);
      setOpen(false);
      setHighlightIndex(-1);
    }
  }

  function chooseSuggestion(item) {
    const shouldClose = onPickSuggestion(item);
    if (shouldClose === false) return;
    setOpen(false);
    setHighlightIndex(-1);
  }

  function handlePick(item) {
    chooseSuggestion(item);
  }

  return (
    <div className="autocomplete" ref={containerRef}>
      <input
        ref={inputRef}
        id={inputId}
        className="autocomplete-input"
        type="text"
        role="combobox"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck="false"
        aria-expanded={showList}
        aria-controls={showList ? listId : undefined}
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-activedescendant={activeDescendant}
        placeholder={placeholder}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        onClick={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
      />

      {showList ? (
        <ul
          id={listId}
          className="autocomplete-list"
          role="listbox"
          ref={listRef}
        >
          {suggestions.map((vegetable, index) => {
            const highlighted = index === highlightIndex;
            return (
              <li
                key={vegetable.id}
                id={`${listId}-option-${index}`}
                role="option"
                aria-selected={highlighted}
                className={
                  highlighted
                    ? 'autocomplete-option is-highlighted'
                    : 'autocomplete-option'
                }
                onMouseEnter={() => setHighlightIndex(index)}
                onMouseLeave={() => setHighlightIndex(-1)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handlePick(vegetable)}
              >
                {vegetable.name}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
