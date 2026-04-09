"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SearchDrawer({ isOpen, onClose }: SearchDrawerProps) {
    const [query, setQuery] = useState("");
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus input when drawer opens
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setQuery("");
        }
    }, [isOpen]);

    const handleSearch = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (query.trim()) {
            router.push(`/shop?search=${encodeURIComponent(query.trim())}`);
            onClose();
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 z-[100] bg-black/40 transition-opacity backdrop-blur-sm",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Side Drawer */}
            <div
                className={cn(
                    "fixed inset-y-0 right-0 z-[110] w-full max-w-md bg-white/30 backdrop-blur-2xl border-l border-zinc-200/50 shadow-2xl transition-transform duration-500 ease-in-out",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                <div className="flex h-full flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-zinc-100 px-8 py-4">
                        <span className="font-yapari text-xl tracking-tighter uppercase transition-opacity duration-500">
                            BLACTIFY
                        </span>
                        <button
                            onClick={onClose}
                            className="p-1 border border-black hover:bg-zinc-50 transition-colors text-black"
                            aria-label="Close search"
                        >
                        <X size={16}  />
                        </button>
                    </div>

                    {/* Search Field Area */}
                    <div className="flex-1 px-8 py-8">
                        <form onSubmit={handleSearch} className="flex items-center gap-2">
                            <div className="flex-1">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Search Now..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="w-full bg-white border border-zinc-400 py-3 px-4 text-sm focus:outline-none transition-all placeholder:text-zinc-500"
                                />
                            </div>
                            <button
                                type="submit"
                                className="p-3 bg-zinc-500 hover:bg-zinc-600 text-white transition-all active:scale-95"
                            >
                                <Search size={22} strokeWidth={2} />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
