import { ChevronUp, ChevronDown } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

// Define the shape of each dropdown option
export interface DropdownOption {
  label: string;
  value: string | number;
}

// Define the component's props interface
interface DropdownProps {
  label?: string;
  options: DropdownOption[];
  selectedValue: string | number | null;
  placeholder?: string;
  onChange: (value: string | number) => void;
}

export const Dropdown: React.FC<DropdownProps> = ({
  label,
  options,
  selectedValue,
  placeholder = 'Select an option',
  onChange
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOptionClick = (value: string | number) => {
    onChange(value);
    setTimeout(() => {
      setIsOpen(false);
    }, 100);
  };

  return (
    <div ref={dropdownRef} className="dropdown-container">
      {label && (
        <label className="dropdown-label">
          <span>{label}</span>
          <button type="button" onClick={() => setIsOpen(!isOpen)} className="dropdown-trigger">
            {selectedOption ? selectedOption.label : placeholder}
            <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
            {/* <span className="dropdown-arrow">{isOpen ? <ChevronUp /> : <ChevronDown />}</span> */}
          </button>
          {isOpen && (
            <ul className="dropdown-menu">
              {options.map((option) => (
                <li
                  key={option.value}
                  className={selectedValue === option.value ? 'dropdown-item selected' : 'dropdown-item'}
                  onClick={() => handleOptionClick(option.value)}>
                  {option.label}
                </li>
              ))}
            </ul>
          )}
        </label>
      )}
    </div>
  );
};
