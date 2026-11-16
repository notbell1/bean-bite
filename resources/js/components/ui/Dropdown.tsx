import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

export interface DropdownOption {
    value: string | number;
    label: string;
    description?: string;
    icon?: React.ReactNode;
    badge?: string;
    disabled?: boolean;
}

export interface CustomDropdownProps {
    options: DropdownOption[];
    value?: string | number;
    onChange: (value: string | number) => void;
    placeholder?: string;
    label?: string;
    error?: string;
    searchable?: boolean;
    disabled?: boolean;
    size?: 'sm' | 'md';
    className?: string;
    triggerClassName?: string;
    menuClassName?: string;
    align?: 'left' | 'right';
    matchTriggerWidth?: boolean;
}

/**
 * Dropdown Kustom Bean & Bite
 * Fitur: Soft warm design, search filter, checkmark indicator, keyboard support, responsive non-truncated popover
 */
export const Dropdown: React.FC<CustomDropdownProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Pilih opsi...',
    label,
    error,
    searchable = false,
    disabled = false,
    size = 'md',
    className = '',
    triggerClassName = '',
    menuClassName = '',
    align = 'left',
    matchTriggerWidth = true,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find((opt) => String(opt.value) === String(value));

    const sizeStyles = {
        sm: 'px-2.5 py-1 text-xs rounded-xl min-h-[34px]',
        md: 'px-3.5 py-2 text-sm rounded-xl min-h-[42px]',
    };

    // Filter pencarian opsi jika searchable aktif
    const filteredOptions = searchable
        ? options.filter((opt) =>
              opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (opt.description &&
                  opt.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
              (opt.badge &&
                  opt.badge.toLowerCase().includes(searchQuery.toLowerCase()))
          )
        : options;

    // Klik di luar dropdown untuk menutup menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    // Fokus otomatis ke search input saat dropdown terbuka
    useEffect(() => {
        if (isOpen && searchable && searchInputRef.current) {
            setTimeout(() => searchInputRef.current?.focus(), 50);
        }
    }, [isOpen, searchable]);

    const handleSelect = (option: DropdownOption) => {
        if (option.disabled) return;
        onChange(option.value);
        setIsOpen(false);
        setSearchQuery('');
    };

    return (
        <div className={`relative w-full ${className}`} ref={dropdownRef}>
            {label && (
                <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-800 mb-1.5">
                    {label}
                </label>
            )}

            {/* Tombol Pemicu Dropdown */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between gap-2 bg-white border text-left transition-all duration-200 select-none shadow-2xs ${
                    sizeStyles[size]
                } ${
                    error
                        ? 'border-berry-500 ring-2 ring-berry-100'
                        : isOpen
                        ? 'border-coffee-700 ring-2 ring-coffee-100 shadow-xs'
                        : 'border-coffee-200 hover:border-coffee-400'
                } ${
                    disabled
                        ? 'bg-coffee-50 text-coffee-300 cursor-not-allowed border-coffee-200'
                        : 'text-coffee-900 cursor-pointer'
                } ${triggerClassName}`}
            >
                <div className="flex items-center gap-1.5 truncate min-w-0 flex-1">
                    {selectedOption?.icon && (
                        <span className="text-coffee-600 shrink-0">
                            {selectedOption.icon}
                        </span>
                    )}
                    <span
                        className={`truncate font-semibold ${
                            size === 'sm' ? 'text-xs' : 'text-sm'
                        } ${
                            selectedOption ? 'text-coffee-950 font-bold' : 'text-coffee-400'
                        }`}
                    >
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    {selectedOption?.badge && (
                        <span className="hidden sm:inline-flex text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-coffee-100 text-coffee-700 border border-coffee-200/60 shrink-0">
                            {selectedOption.badge}
                        </span>
                    )}
                </div>

                <ChevronDown
                    className={`w-3.5 h-3.5 text-coffee-500 transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180 text-coffee-800' : ''
                    }`}
                />
            </button>

            {/* Pesan Error */}
            {error && <p className="text-xs text-berry-600 mt-1 font-medium">{error}</p>}

            {/* Menu Dropdown Menu Box (Lebar Dinamis, Dapat Mengikuti Ukuran Trigger atau Konten) */}
            {isOpen && (
                <div
                    className={`absolute z-50 mt-1.5 bg-white border border-coffee-200 rounded-2xl shadow-xl shadow-coffee-900/15 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
                        matchTriggerWidth
                            ? 'w-full left-0 right-0 min-w-full'
                            : `min-w-full sm:min-w-[240px] w-max max-w-[calc(100vw-2rem)] ${
                                align === 'right' ? 'right-0 left-auto' : 'left-0 sm:left-auto right-0 sm:right-auto'
                              }`
                    } ${menuClassName}`}
                >
                    {/* Search Field */}
                    {searchable && (
                        <div className="p-1.5 sm:p-2 border-b border-coffee-100">
                            <div className="relative">
                                <Search className="w-3.5 h-3.5 text-coffee-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari..."
                                    className="w-full pl-7 pr-2.5 py-1 text-xs bg-coffee-50 border border-coffee-200 rounded-lg text-coffee-900 placeholder-coffee-400 focus:outline-none focus:border-coffee-600 focus:bg-white transition"
                                />
                            </div>
                        </div>
                    )}

                    {/* List Opsi */}
                    <div className="max-h-60 overflow-y-auto p-1 divide-y divide-coffee-50 scrollbar-thin">
                        {filteredOptions.length === 0 ? (
                            <div className="px-4 py-3 text-center text-xs text-coffee-400">
                                Tidak ada opsi yang cocok.
                            </div>
                        ) : (
                            filteredOptions.map((opt) => {
                                const isSelected = String(opt.value) === String(value);
                                return (
                                    <div
                                        key={String(opt.value)}
                                        onClick={() => handleSelect(opt)}
                                        className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl cursor-pointer text-xs transition-colors ${
                                            opt.disabled
                                                ? 'opacity-40 cursor-not-allowed bg-transparent'
                                                : isSelected
                                                ? 'bg-coffee-100 text-coffee-950 font-semibold'
                                                : 'text-coffee-800 hover:bg-coffee-50 hover:text-coffee-950'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            {opt.icon && (
                                                <span className="text-coffee-600 shrink-0">
                                                    {opt.icon}
                                                </span>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-coffee-950 text-xs truncate">
                                                    {opt.label}
                                                </p>
                                                {opt.description && (
                                                    <p className="text-[10px] text-coffee-500 font-normal leading-tight mt-0.5 truncate">
                                                        {opt.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {opt.badge && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-coffee-100 text-coffee-700 border border-coffee-200/60 whitespace-nowrap">
                                                    {opt.badge}
                                                </span>
                                            )}
                                            {isSelected && (
                                                <Check className="w-3.5 h-3.5 text-coffee-900 shrink-0" />
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dropdown;
