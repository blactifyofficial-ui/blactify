"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";

interface FiltersProps {
    totalResults: number;
    initialSearch?: string;
    initialCategory?: string;
    initialSortBy?: string;
}

export default function Filters({ totalResults, initialSearch = "", initialCategory = "All", initialSortBy = "newest" }: FiltersProps) {
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
        const currentSortBy = params.get("sortBy") || "newest";

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
            if (sortBy !== "newest") params.set("sortBy", sortBy);
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
        setSortBy("newest");
    };

    return (
        <>


            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5 mt-4">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-zinc-600 uppercase tracking-widest">
                        {totalResults} Results
                    </span>
                    {(searchQuery || selectedCategory !== "All" || sortBy !== "newest") && (
                        <button
                            onClick={handleReset}
                            className="text-[10px] font-bold uppercase tracking-widest underline text-zinc-500 hover:text-white ml-2"
                        >
                            Reset
                        </button>
                    )}
                </div>

                <div className="relative">
                    <button
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        className="flex items-center gap-1.5 text-xs font-medium text-white active:scale-95 transition-all"
                    >
                        Sort: {sortBy === "newest" ? "Newest" : sortBy === "price-low" ? "Price Low-High" : sortBy === "price-high" ? "Price High-Low" : "Mixed"}
                        <Filter size={12} className={cn("transition-transform", isSortOpen && "rotate-180")} />
                    </button>

                    {isSortOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setIsSortOpen(false)}
                            />
                            <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                {[
                                    { id: "newest", label: "Newest" },
                                    { id: "price-low", label: "Price: Low to High" },
                                    { id: "price-high", label: "Price: High to Low" },
                                    { id: "mixed", label: "Mixed (Random)" }
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
                                                ? "bg-white text-black"
                                                : "text-zinc-500 hover:bg-white/5 hover:text-white"
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
