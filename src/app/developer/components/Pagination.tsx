"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}

export function DevPagination({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
}: PaginationProps) {
    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    // Generate page numbers to show (with ellipsis logic if needed, but let's keep it simple for now)
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        
        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, start + maxVisible - 1);
        
        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-4 border-t border-[var(--dev-border)] gap-4">
            <p className="text-[11px] text-[var(--dev-text-dim)] font-medium">
                Showing <span className="text-[var(--dev-text-secondary)]">{startItem}</span>–<span className="text-[var(--dev-text-secondary)]">{endItem}</span> of <span className="text-[var(--dev-text-secondary)]">{totalItems}</span> entries
            </p>
            
            <div className="flex items-center gap-1.5">
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--dev-border)] bg-[var(--dev-card)] text-[var(--dev-text-dim)] hover:text-[var(--dev-text-secondary)] hover:bg-[var(--dev-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronLeft size={14} />
                </button>

                {getPageNumbers().map((pageNum) => (
                    <button
                        key={pageNum}
                        onClick={() => onPageChange(pageNum)}
                        className={cn(
                            "w-8 h-8 flex items-center justify-center rounded-lg text-[11px] font-bold transition-all border",
                            currentPage === pageNum
                                ? "bg-[var(--dev-active)] text-[var(--dev-text)] border-[var(--dev-accent)]"
                                : "bg-[var(--dev-card)] text-[var(--dev-text-dim)] border-[var(--dev-border)] hover:text-[var(--dev-text-secondary)] hover:bg-[var(--dev-hover)]"
                        )}
                    >
                        {pageNum}
                    </button>
                ))}

                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--dev-border)] bg-[var(--dev-card)] text-[var(--dev-text-dim)] hover:text-[var(--dev-text-secondary)] hover:bg-[var(--dev-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
}
