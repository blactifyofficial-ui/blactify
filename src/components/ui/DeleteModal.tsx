"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    loading?: boolean;
}

export function DeleteModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    loading = false
}: DeleteModalProps) {
    if (!isOpen) return null;

    return (
        <>
            <div
                className={cn(
                    "fixed inset-0 z-[70] bg-black/40 transition-opacity backdrop-blur-sm",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />
            <div
                className={cn(
                    "fixed left-1/2 top-1/2 z-[80] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 bg-white p-6 shadow-2xl rounded-3xl transition-all duration-300 scale-100 opacity-100",
                    !isOpen && "scale-95 opacity-0 pointer-events-none"
                )}
            >
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                        <AlertTriangle size={24} />
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-lg font-bold text-zinc-900">{title}</h3>
                        <p className="text-sm text-zinc-500">{description}</p>
                    </div>

                    <div className="flex gap-3 w-full pt-2">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-bold text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-all disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? "Deleting..." : "Delete"}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
