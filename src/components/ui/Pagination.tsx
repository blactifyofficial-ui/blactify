"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        const showEllipsis = totalPages > 7;

        if (!showEllipsis) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Logic for showing ellipsis
            if (currentPage <= 4) {
                // Show first 5 pages, then ellipsis, then last page
                for (let i = 1; i <= 5; i++) pages.push(i);
                pages.push("ellipsis-1");
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 3) {
                // Show first page, then ellipsis, then last 5 pages
                pages.push(1);
                pages.push("ellipsis-1");
                for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
            } else {
                // Show first page, ellipsis, current-1, current, current+1, ellipsis, last page
                pages.push(1);
                pages.push("ellipsis-1");
                pages.push(currentPage - 1);
                pages.push(currentPage);
                pages.push(currentPage + 1);
                pages.push("ellipsis-2");
                pages.push(totalPages);
            }
        }
        return pages;
    };

    return (
        <div className={cn("flex items-center justify-center gap-2", className)}>
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-10 h-10 flex items-center justify-center bg-white border border-zinc-100 rounded-xl text-zinc-400 hover:text-black hover:border-zinc-300 disabled:opacity-30 disabled:hover:text-zinc-400 disabled:hover:border-zinc-100 transition-all active:scale-90"
            >
                <ChevronLeft size={18} />
            </button>

            <div className="flex items-center gap-1.5">
                {getPageNumbers().map((page, index) => {
                    if (typeof page === "string") {
                        return (
                            <div key={`ellipsis-${index}`} className="w-10 h-10 flex items-center justify-center text-zinc-300">
                                <MoreHorizontal size={16} />
                            </div>
                        );
                    }

                    const isActive = currentPage === page;

                    return (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={cn(
                                "w-10 h-10 flex items-center justify-center rounded-xl text-xs font-black transition-all active:scale-90",
                                isActive
                                    ? "bg-black text-white shadow-lg shadow-black/10 scale-105"
                                    : "bg-white border border-zinc-100 text-zinc-400 hover:text-black hover:border-zinc-300"
                            )}
                        >
                            {page}
                        </button>
                    );
                })}
            </div>

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-10 h-10 flex items-center justify-center bg-white border border-zinc-100 rounded-xl text-zinc-400 hover:text-black hover:border-zinc-300 disabled:opacity-30 disabled:hover:text-zinc-400 disabled:hover:border-zinc-100 transition-all active:scale-90"
            >
                <ChevronRight size={18} />
            </button>
        </div>
    );
}
