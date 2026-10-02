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
  disabled = false,
  closeOnPick = true,
}) {
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [fieldHeld, setFieldHeld] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const parkedScroll = useRef(0);
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listId = `${inputId}-listbox`;
  const showList = open && !disabled && suggestions.length > 0;
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
    const input = inputRef.current;
    if (!input || disabled) return undefined;
    const shell = document.querySelector('.app-shell');
    const previousPadding = shell?.style.paddingBottom ?? '';
    let held = false;
    let sawKeyboard = false;
    let blurTimer = 0;

    function keyboardInset() {
      const view = window.visualViewport;
      const viewHeight = view?.height ?? window.innerHeight;
      return Math.max(
        0,
        window.innerHeight - ((view?.offsetTop ?? 0) + viewHeight),
      );
    }

    function holdPadding() {
      if (!window.matchMedia('(pointer: coarse)').matches) return;
      const keyboard = keyboardInset();
      const focused = document.activeElement === input;
      if (keyboard >= 40) sawKeyboard = true;
      if (!focused) {
        releasePadding();
        return;
      }
      if (keyboard < 40) {
        if (!sawKeyboard) return;
        sawKeyboard = false;
        releasePadding();
        input.blur();
        return;
      }
      if (!shell) return;
      shell.style.paddingBottom = `${Math.max(keyboard + 24, 80)}px`;
      held = true;
    }

    function releasePadding() {
      setFieldHeld(false);
      if (held && shell) {
        shell.style.paddingBottom = previousPadding;
        held = false;
      }
    }

    function onFocus() {
      sawKeyboard = false;
      window.clearTimeout(blurTimer);
      holdPadding();
    }

    function onBlur() {
      window.clearTimeout(blurTimer);
      blurTimer = window.setTimeout(() => {
        if (document.activeElement === input) return;
        releasePadding();
      }, 160);
    }

    input.addEventListener('focus', onFocus);
    input.addEventListener('blur', onBlur);
    const view = window.visualViewport;
    view?.addEventListener('resize', holdPadding);
    view?.addEventListener('scroll', holdPadding);

    return () => {
      window.clearTimeout(blurTimer);
      input.removeEventListener('focus', onFocus);
      input.removeEventListener('blur', onBlur);
      view?.removeEventListener('resize', holdPadding);
      view?.removeEventListener('scroll', holdPadding);
      if (shell) shell.style.paddingBottom = previousPadding;
    };
  }, [disabled]);

  useEffect(() => {
    if (!showList) return undefined;
    const input = inputRef.current;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    if (!coarse || !input) return undefined;
    const listNode = listRef.current;

    function placeList(smooth) {
      const view = window.visualViewport;
      const viewHeight = view?.height ?? window.innerHeight;
      const rect = input.getBoundingClientRect();
      const room = 220;
      const space = viewHeight - rect.bottom;
      if (space < room) {
        const shift = Math.min(Math.max(0, rect.top - 12), room - space);
        if (shift > 4) {
          window.scrollBy({ top: shift, behavior: smooth ? 'smooth' : 'auto' });
        }
      }

      const list = listRef.current;
      if (!list) return;
      const next = input.getBoundingClientRect();
      const nextSpace = viewHeight - next.bottom - 12;
      list.style.maxHeight = `${Math.max(120, Math.min(nextSpace, 320))}px`;
    }

    function rememberScroll() {
      parkedScroll.current = window.scrollY;
    }

    placeList(false);
    rememberScroll();
    const later = window.setTimeout(() => placeList(true), 320);
    const view = window.visualViewport;
    const onViewport = () => placeList(false);
    view?.addEventListener('resize', onViewport);
    view?.addEventListener('scroll', onViewport);
    window.addEventListener('scroll', rememberScroll, { passive: true });
    return () => {
      window.clearTimeout(later);
      view?.removeEventListener('resize', onViewport);
      view?.removeEventListener('scroll', onViewport);
      window.removeEventListener('scroll', rememberScroll);
      if (listNode) listNode.style.maxHeight = '';
      const parked = parkedScroll.current;
      if (!input.isConnected || document.activeElement !== input || parked < 8) return;
      window.requestAnimationFrame(() => {
        if (document.activeElement === input && window.scrollY + 8 < parked) {
          window.scrollTo({ top: parked, behavior: 'auto' });
        }
      });
    };
  }, [showList]);

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
      if (closeOnPick) {
        endEntry();
        return;
      }
      setOpen(false);
      setHighlightIndex(-1);
    }
  }

  function endEntry() {
    setFieldHeld(false);
    setOpen(false);
    setHighlightIndex(-1);
    const shell = document.querySelector('.app-shell');
    if (shell) shell.style.paddingBottom = '';
    inputRef.current?.blur();
  }

  function chooseSuggestion(item) {
    const shouldClose = onPickSuggestion(item);
    if (shouldClose === false) return;
    if (closeOnPick) {
      endEntry();
      return;
    }
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
        disabled={disabled}
        onChange={(event) => {
          if (disabled) return;
          onChange(event.target.value);
          setOpen(true);
          if (window.matchMedia('(pointer: coarse)').matches) setFieldHeld(true);
        }}
        onFocus={() => {
          if (disabled) return;
          if (window.matchMedia('(pointer: coarse)').matches) setFieldHeld(true);
          if (suggestions.length > 0) setOpen(true);
        }}
        onClick={() => {
          if (!disabled && suggestions.length > 0) setOpen(true);
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
      {fieldHeld && !showList ? (
        <div className="autocomplete-hold" aria-hidden="true" />
      ) : null}
    </div>
  );
}
