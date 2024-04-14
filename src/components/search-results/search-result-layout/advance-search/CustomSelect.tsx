/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";
import { RxCross2 } from "react-icons/rx";

export type SelectOption = {
  label: string;
  value: string | number;
};

type MultipleSelectProps = {
  multiple: true;
  value: SelectOption[];
  onChange: (value: SelectOption[]) => void;
};

type SingleSelectProps = {
  multiple?: false;
  value?: SelectOption;
  onChange: (value: SelectOption | undefined) => void;
};

type SelectProps = {
  options: SelectOption[];
  placeholder?: string; // Added placeholder prop
} & (SingleSelectProps | MultipleSelectProps);

export function CustomSelect({
  multiple,
  value,
  onChange,
  options,
  placeholder = "Select...", // Default placeholder text
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  function clearOptions() {
    multiple ? onChange([]) : onChange(undefined);
  }

  function selectOption(option: SelectOption) {
    if (multiple) {
      if (value.includes(option)) {
        onChange(value.filter((o) => o !== option));
      } else {
        onChange([...value, option]);
      }
    } else {
      if (option !== value) onChange(option);
    }
  }

  function isOptionSelected(option: SelectOption) {
    return multiple ? value.includes(option) : option === value;
  }

  useEffect(() => {
    if (isOpen) setHighlightedIndex(0);
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target != containerRef.current) return;
      switch (e.code) {
        case "Enter":
        case "Space":
          setIsOpen((prev) => !prev);
          if (isOpen) selectOption(options[highlightedIndex]);
          break;
        case "ArrowUp":
        case "ArrowDown": {
          if (!isOpen) {
            setIsOpen(true);
            break;
          }

          const newValue = highlightedIndex + (e.code === "ArrowDown" ? 1 : -1);
          if (newValue >= 0 && newValue < options.length) {
            setHighlightedIndex(newValue);
          }
          break;
        }
        case "Escape":
          setIsOpen(false);
          break;
      }
    };
    containerRef.current?.addEventListener("keydown", handler);

    return () => {
      containerRef.current?.removeEventListener("keydown", handler);
    };
  }, [isOpen, highlightedIndex, options]);

  return (
    <div
      ref={containerRef}
      onBlur={() => setIsOpen(false)}
      onClick={() => setIsOpen((prev) => !prev)}
      tabIndex={0}
      className='select_container md:w-[280px] w-full'>
      <span className='value'>
        {value &&
          (multiple
            ? value.map((v) => (
                <button
                  key={v.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    selectOption(v);
                  }}
                  className='option-badge flex items-center justify-between'>
                  {v.label}
                  <span className='remove-btn'>
                    <RxCross2 />
                  </span>
                </button>
              ))
            : value.label)}
        {(!value || (multiple && value.length === 0)) && (
          <span className='placeholder'>{placeholder}</span>
        )}
        {/* Render placeholder if no value selected */}
      </span>

      {Array.isArray(value) && value.length > 0 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearOptions();
            }}
            className='clear-btn'>
            <RxCross2 />
          </button>
          <div className='divider'></div>
        </>
      )}

      <div className='caret_btn'>
        <svg
          height='20'
          width='20'
          viewBox='0 0 20 20'
          aria-hidden='true'
          focusable='false'>
          <path d='M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z'></path>
        </svg>
      </div>
      <ul className={`options shadow-md   ${isOpen ? "show" : ""}`}>
        {options?.map((option, index) => (
          <li
            onClick={(e) => {
              e.stopPropagation();
              selectOption(option);
              setIsOpen(false);
            }}
            onMouseEnter={() => setHighlightedIndex(index)}
            key={option.value}
            className={`"option"${isOptionSelected(option) ? "selected" : ""} ${
              index === highlightedIndex ? "highlighted" : ""
            }`}>
            {option.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
