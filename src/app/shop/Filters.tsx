"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Filter } from "lucide-react";
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

    // Track the last URL we pushed to avoid loops
    const lastPushedRef = useRef("");

    // Synchronize state with props DURING render to avoid stale state in effects
    // This is the recommended pattern for syncing state from props in React
    const [prevInitialCategory, setPrevInitialCategory] = useState(initialCategory);
    const [prevInitialSearch, setPrevInitialSearch] = useState(initialSearch);

    if (initialCategory !== prevInitialCategory) {
        setSelectedCategory(initialCategory || "All");
        setPrevInitialCategory(initialCategory);
    }

    if (initialSearch !== prevInitialSearch) {
        setSearchQuery(initialSearch || "");
        setPrevInitialSearch(initialSearch);
    }

    // Sync to URL
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        const currentSearch = params.get("search") || "";
        const currentCategory = params.get("category") || "All";
        const currentSortBy = params.get("sortBy") || "mixed";

        let changed = false;

        // Search
        if (debouncedSearchQuery !== currentSearch) {
            if (debouncedSearchQuery) params.set("search", debouncedSearchQuery);
            else params.delete("search");
            changed = true;
        }

        // Category
        if (selectedCategory !== currentCategory) {
            if (selectedCategory !== "All") params.set("category", selectedCategory);
            else params.delete("category");
            changed = true;
        }

        // Sort
        if (sortBy !== currentSortBy) {
            if (sortBy !== "mixed") params.set("sortBy", sortBy);
            else params.delete("sortBy");
            changed = true;
        }

        if (changed) {
            const newUrl = `${pathname}?${params.toString()}`;
            // Only push if it's different from what we last pushed
            if (newUrl !== lastPushedRef.current) {
                lastPushedRef.current = newUrl;
                router.push(newUrl, { scroll: false });
            }
        }
    }, [debouncedSearchQuery, selectedCategory, sortBy, pathname, router, searchParams]);

    const handleReset = () => {
        setSearchQuery("");
        setSelectedCategory("All");
        setSortBy("mixed");
    };

    return (
        <>
            <header className="mb-0 mt-2">
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
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2 scroll-smooth">
                        {categories.map((cat) => {
                            const trimmedCat = cat.trim();
                            const isSelected = selectedCategory.trim().toLowerCase() === trimmedCat.toLowerCase() || (trimmedCat === "All" && selectedCategory === "All");
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(trimmedCat)}
                                    className={cn(
                                        "whitespace-nowrap px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95",
                                        isSelected
                                            ? "bg-black text-white shadow-lg shadow-black/10"
                                            : "bg-zinc-50 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900"
                                    )}
                                >
                                    {trimmedCat}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </header>

            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-50 mt-4">
                <div className="flex items-center gap-3">
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
        </>
    );
}
