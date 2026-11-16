import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from '@inertiajs/react';

export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange?: (page: number) => void;
    getPageUrl?: (page: number) => string;
    totalItems?: number;
    itemsPerPage?: number;
    showSummary?: boolean;
    className?: string;
}

/**
 * Komponen Pagination Global Bean & Bite
 * 
 * Format Pola Sesuai Kebutuhan:
 * 1. Di Halaman Awal:   < 1 2 3 4 .. 20 >
 * 2. Di Halaman Akhir:  < 1 .. 17 18 19 20 >
 * 3. Di Halaman Tengah: < 1 .. 13 14 15 .. 20 >
 */
export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    getPageUrl,
    totalItems,
    itemsPerPage,
    showSummary = true,
    className = '',
}) => {
    if (totalPages <= 1 && !totalItems) {
        return null;
    }

    // Algoritma pembentukan halaman sesuai spesifikasi persis
    const getPageNumbers = (): (number | string)[] => {
        // Jika total halaman sedikit (<= 6), tampilkan semua nomor
        if (totalPages <= 6) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        // 1. Pola Awal: < 1 2 3 4 .. 20 >
        if (currentPage <= 3) {
            return [1, 2, 3, 4, '..', totalPages];
        }

        // 2. Pola Akhir: < 1 .. 17 18 19 20 >
        if (currentPage >= totalPages - 2) {
            return [
                1,
                '..',
                totalPages - 3,
                totalPages - 2,
                totalPages - 1,
                totalPages,
            ];
        }

        // 3. Pola Tengah: < 1 .. 13 14 15 .. 20 >
        return [
            1,
            '..',
            currentPage - 1,
            currentPage,
            currentPage + 1,
            '..',
            totalPages,
        ];
    };

    const pages = getPageNumbers();

    // Hitung ringkasan rentang item
    const startItem = totalItems && itemsPerPage ? (currentPage - 1) * itemsPerPage + 1 : null;
    const endItem =
        totalItems && itemsPerPage
            ? Math.min(currentPage * itemsPerPage, totalItems)
            : null;

    const renderPageButton = (page: number | string, index: number) => {
        if (page === '..') {
            return (
                <span
                    key={`ellipsis-${index}`}
                    className="inline-flex items-center justify-center w-6 h-8 text-xs font-bold text-coffee-400 select-none tracking-widest"
                >
                    ..
                </span>
            );
        }

        const pageNum = Number(page);
        const isActive = pageNum === currentPage;

        const baseStyle =
            'inline-flex items-center justify-center w-8 h-8 text-xs font-bold rounded-lg transition-all duration-150 select-none cursor-pointer';
        const activeStyle =
            'bg-coffee-900 text-white shadow-xs border border-coffee-950 scale-102';
        const inactiveStyle =
            'text-coffee-700 bg-white border border-coffee-200/90 hover:bg-coffee-100 hover:border-coffee-300 hover:text-coffee-950 active:scale-95';

        if (getPageUrl) {
            return (
                <Link
                    key={`page-${pageNum}`}
                    href={getPageUrl(pageNum)}
                    className={`${baseStyle} ${isActive ? activeStyle : inactiveStyle}`}
                >
                    {pageNum}
                </Link>
            );
        }

        return (
            <button
                key={`page-${pageNum}`}
                type="button"
                onClick={() => onPageChange && onPageChange(pageNum)}
                className={`${baseStyle} ${isActive ? activeStyle : inactiveStyle}`}
            >
                {pageNum}
            </button>
        );
    };

    const renderPrevButton = () => {
        const isDisabled = currentPage <= 1;
        const baseStyle =
            'inline-flex items-center justify-center w-8 h-8 text-xs font-semibold rounded-lg border transition-all duration-150 select-none cursor-pointer';
        const disabledStyle =
            'bg-coffee-50 border-coffee-200/60 text-coffee-300 cursor-not-allowed opacity-50';
        const activeStyle =
            'bg-white border-coffee-200/90 text-coffee-700 hover:bg-coffee-100 hover:border-coffee-300 hover:text-coffee-950 active:scale-95';

        if (isDisabled) {
            return (
                <button type="button" disabled className={`${baseStyle} ${disabledStyle}`} aria-label="Halaman Sebelumnya">
                    <ChevronLeft className="w-3.5 h-3.5" />
                </button>
            );
        }

        if (getPageUrl) {
            return (
                <Link
                    href={getPageUrl(currentPage - 1)}
                    className={`${baseStyle} ${activeStyle}`}
                    aria-label="Halaman Sebelumnya"
                >
                    <ChevronLeft className="w-3.5 h-3.5" />
                </Link>
            );
        }

        return (
            <button
                type="button"
                onClick={() => onPageChange && onPageChange(currentPage - 1)}
                className={`${baseStyle} ${activeStyle}`}
                aria-label="Halaman Sebelumnya"
            >
                <ChevronLeft className="w-3.5 h-3.5" />
            </button>
        );
    };

    const renderNextButton = () => {
        const isDisabled = currentPage >= totalPages;
        const baseStyle =
            'inline-flex items-center justify-center w-8 h-8 text-xs font-semibold rounded-lg border transition-all duration-150 select-none cursor-pointer';
        const disabledStyle =
            'bg-coffee-50 border-coffee-200/60 text-coffee-300 cursor-not-allowed opacity-50';
        const activeStyle =
            'bg-white border-coffee-200/90 text-coffee-700 hover:bg-coffee-100 hover:border-coffee-300 hover:text-coffee-950 active:scale-95';

        if (isDisabled) {
            return (
                <button type="button" disabled className={`${baseStyle} ${disabledStyle}`} aria-label="Halaman Berikutnya">
                    <ChevronRight className="w-3.5 h-3.5" />
                </button>
            );
        }

        if (getPageUrl) {
            return (
                <Link
                    href={getPageUrl(currentPage + 1)}
                    className={`${baseStyle} ${activeStyle}`}
                    aria-label="Halaman Berikutnya"
                >
                    <ChevronRight className="w-3.5 h-3.5" />
                </Link>
            );
        }

        return (
            <button
                type="button"
                onClick={() => onPageChange && onPageChange(currentPage + 1)}
                className={`${baseStyle} ${activeStyle}`}
                aria-label="Halaman Berikutnya"
            >
                <ChevronRight className="w-3.5 h-3.5" />
            </button>
        );
    };

    return (
        <div
            className={`flex flex-col sm:flex-row items-center justify-between gap-3 py-2 px-1 text-xs ${className}`}
        >
            {/* Ringkasan Jumlah Data */}
            {showSummary && totalItems !== undefined && (
                <p className="text-xs text-coffee-600 font-medium">
                    Menampilkan{' '}
                    <span className="font-semibold text-coffee-900">
                        {startItem ?? 1}-{endItem ?? totalItems}
                    </span>{' '}
                    dari{' '}
                    <span className="font-semibold text-coffee-900">{totalItems}</span> data
                </p>
            )}

            {/* List Tombol Navigasi Halaman */}
            <div className="inline-flex items-center gap-1 p-1 bg-coffee-100/60 border border-coffee-200/90 rounded-xl shadow-xs">
                {renderPrevButton()}
                <div className="inline-flex items-center gap-1">{pages.map(renderPageButton)}</div>
                {renderNextButton()}
            </div>
        </div>
    );
};

export default Pagination;
