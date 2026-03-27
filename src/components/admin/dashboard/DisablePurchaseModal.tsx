"use client";

import { AlertTriangle, X, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface DisablePurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    confirmationText: string;
    setConfirmationText: (text: string) => void;
    onConfirm: () => void;
    isUpdating: boolean;
}

export function DisablePurchaseModal({
    isOpen,
    onClose,
    confirmationText,
    setConfirmationText,
    onConfirm,
    isUpdating
}: DisablePurchaseModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl shadow-black/20 border border-zinc-100 animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-red-50 rounded-2xl text-red-600">
                        <AlertTriangle size={24} />
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
                    >
                        <X size={20} className="text-zinc-400" />
                    </button>
                </div>

                <h3 className="text-xl font-black text-zinc-900 mb-2">Turn off purchases?</h3>
                <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
                    This will stop customers from buying products. They will see a maintenance message.
                    This takes effect immediately.
                </p>

                <div className="space-y-4">
                    <p className="text-sm text-zinc-500 mb-4">
                        To confirm, please type <span className="font-bold text-black">STOP BUYING</span> below.
                    </p>
                    <input
                        type="text"
                        value={confirmationText}
                        onChange={(e) => setConfirmationText(e.target.value)}
                        placeholder="STOP BUYING"
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/5 transition-all mb-6"
                    />
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={confirmationText !== "STOP BUYING" || isUpdating}
                            onClick={onConfirm}
                            className={cn(
                                "flex-1 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                confirmationText === "STOP BUYING"
                                    ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20"
                                    : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                            )}
                        >
                            {isUpdating ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Lock size={14} />
                                    Confirm Disable
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
