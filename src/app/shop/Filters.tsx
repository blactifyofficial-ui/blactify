"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Filter, Menu, X as CloseIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";

interface FiltersProps {
    categories: string[];
    totalResults: number;
    initialSearch?: string;
    initialCategory?: string;
    initialSortBy?: string;
}

export default function Filters({ categories, totalResults, initialSearch = "", initialCategory = "All", initialSortBy = "mixed" }: FiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const debouncedSearchQuery = useDebounce(searchQuery, 400);
    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [sortBy, setSortBy] = useState(initialSortBy);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Sync to URL
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());

        let changed = false;

        if (debouncedSearchQuery && debouncedSearchQuery !== params.get("search")) {
            params.set("search", debouncedSearchQuery);
            changed = true;
        } else if (!debouncedSearchQuery && params.has("search")) {
            params.delete("search");
            changed = true;
        }

        if (selectedCategory !== "All" && selectedCategory !== params.get("category")) {
            params.set("category", selectedCategory);
            changed = true;
        } else if (selectedCategory === "All" && params.has("category")) {
            params.delete("category");
            changed = true;
        }

        if (sortBy !== "mixed" && sortBy !== params.get("sortBy")) {
            params.set("sortBy", sortBy);
            changed = true;
        } else if (sortBy === "mixed" && params.has("sortBy")) {
            params.delete("sortBy");
            changed = true;
        }

        if (changed) {
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        }
    }, [debouncedSearchQuery, selectedCategory, sortBy, pathname, router, searchParams]);

    const handleReset = () => {
        setSearchQuery("");
        setSelectedCategory("All");
        setSortBy("mixed");
    };

    return (
        <>
            <header className="mb-0 mt-8">
                <h1 className="font-empire text-xl mb-2">Store</h1>

                <div className="flex flex-col gap-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search our collection..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-zinc-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-sans focus:ring-2 focus:ring-black outline-none transition-all"
                        />
                    </div>
                </div>
            </header>

            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-50 mt-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="p-1 text-black hover:bg-zinc-100 rounded-lg transition-colors active:scale-95"
                    >
                        <Menu size={20} />
                    </button>
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">
                        {totalResults} Results
                    </span>
                    {(searchQuery || selectedCategory !== "All" || sortBy !== "mixed") && (
                        <button
                            onClick={handleReset}
                            className="text-[10px] font-bold uppercase tracking-widest underline text-zinc-500 hover:text-black ml-2"
                        >
                            Reset
                        </button>
                    )}
                </div>
                <div className="relative">
                    <button
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        className="flex items-center gap-1.5 text-xs font-medium text-black active:scale-95 transition-all"
                    >
                        Sort: {sortBy === "mixed" ? "Mixed" : sortBy === "newest" ? "Newest" : sortBy === "price-low" ? "Price Low-High" : "Price High-Low"}
                        <Filter size={12} className={cn("transition-transform", isSortOpen && "rotate-180")} />
                    </button>

                    {isSortOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setIsSortOpen(false)}
                            />
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-zinc-100 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                {[
                                    { id: "mixed", label: "Mixed (Random)" },
                                    { id: "newest", label: "Newest" },
                                    { id: "price-low", label: "Price: Low to High" },
                                    { id: "price-high", label: "Price: High to Low" }
                                ].map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => {
                                            setSortBy(option.id);
                                            setIsSortOpen(false);
                                        }}
                                        className={cn(
                                            "w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                                            sortBy === option.id
                                                ? "bg-zinc-900 text-white"
                                                : "text-zinc-500 hover:bg-zinc-50 hover:text-black"
                                        )}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Category Hamburger Menu Drawer */}
            <div
                className={cn(
                    "fixed inset-0 z-[100] bg-black/40 transition-opacity duration-300",
                    isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsMenuOpen(false)}
            />
            <div
                className={cn(
                    "fixed inset-y-0 left-0 z-[110] w-full max-w-[280px] bg-white/70 backdrop-blur-md border-r border-zinc-200/50 shadow-2xl transition-transform duration-300 ease-out",
                    isMenuOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between px-6 py-6 border-b border-zinc-200/50">
                        <h3 className="font-empire text-xl text-black">Categories</h3>
                        <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                            <CloseIcon size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto py-6 px-4">
                        <div className="space-y-1">
                            {categories.map((cat: string) => (
                                <button
                                    key={cat}
                                    onClick={() => {
                                        setSelectedCategory(cat);
                                        setIsMenuOpen(false);
                                    }}
                                    className={cn(
                                        "w-full text-left px-5 py-4 rounded-2xl text-sm font-medium transition-all",
                                        selectedCategory === cat
                                            ? "bg-black/5 text-black transform scale-[1.02]"
                                            : "text-zinc-500 hover:bg-black/5 hover:text-black"
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 border-t border-zinc-200/50 bg-black/5">
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em]">Select category to filter</p>
                    </div>
                </div>
            </div>
        </>
    );
}
