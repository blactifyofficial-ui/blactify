"use client";

import { useState } from "react";
import { useAuth } from "@/store/AuthContext";
import { auth } from "@/lib/firebase";
import { updateProfile, signOut } from "firebase/auth";
import { syncUserProfile } from "@/lib/profile-sync";
import { ChevronLeft, User, Mail, Check, AlertCircle, Save, X, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCartStore } from "@/store/useCartStore";

export default function SettingsPage() {
    const { user, loading: authLoading } = useAuth();
    const [name, setName] = useState(user?.displayName || "");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const router = useRouter();

    // Delete Account State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteAccount = async () => {
        if (confirmText !== "bye bactify" || !user) return;

        setIsDeleting(true);
        try {
            // 1. Delete from Supabase & Cloudinary via API
            const response = await fetch('/api/user/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.uid })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete account data');
            }

            // 2. Clear stores and local storage
            useCartStore.getState().clearCart();
            localStorage.clear();
            sessionStorage.clear();

            // 3. Delete from Firebase Auth & Sign Out
            if (auth.currentUser) {
                await auth.currentUser.delete();
                await signOut(auth);
            }

            toast.success("Account deleted successfully");
            router.push('/');
        } catch {
            toast.error("Process Failure");
        } finally {
            setIsDeleting(false);
            setConfirmText("");
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth.currentUser) return;

        setLoading(true);
        setStatus(null);

        try {
            // 1. Update Firebase Profile
            await updateProfile(auth.currentUser, {
                displayName: name
            });

            // 2. Sync to Supabase
            await syncUserProfile(auth.currentUser);

            setStatus({ type: 'success', message: 'Profile updated successfully!' });
        } catch {

            setStatus({ type: 'error', message: 'Failed to update profile. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center font-sans">
                <h1 className="font-empire text-3xl mb-4">Access Denied</h1>
                <p className="text-zinc-500 mb-8">Please sign in to access settings.</p>
                <Link href="/profile" className="bg-black text-white px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest">
                    Go to Login
                </Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-white pb-20 pt-8 font-sans">
            <div className="px-6 max-w-lg mx-auto">
                <header className="mb-10">
                    <Link href="/profile" className="flex items-center gap-2 text-zinc-400 hover:text-black transition-colors mb-6 text-xs font-bold uppercase tracking-widest">
                        <ChevronLeft size={16} />
                        Back to Profile
                    </Link>
                    <h1 className="font-empire text-5xl">Settings</h1>
                </header>

                <div className="space-y-12">
                    <section>
                        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-8">Personal Information</h2>

                        <form onSubmit={handleUpdateProfile} className="space-y-8">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Display Name</label>
                                <div className="relative">
                                    <User className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full border-b border-zinc-200 py-4 pl-8 text-sm focus:border-black outline-none transition-colors bg-transparent"
                                        placeholder="Full Name"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-100" size={18} />
                                    <input
                                        type="email"
                                        disabled
                                        value={user.email || ""}
                                        className="w-full border-b border-zinc-100 py-4 pl-8 text-sm text-zinc-300 outline-none bg-transparent cursor-not-allowed"
                                    />
                                    <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-zinc-200">
                                        Verified
                                    </span>
                                </div>
                                <p className="text-[10px] text-zinc-400 italic mt-2">Email cannot be changed for security reasons.</p>
                            </div>

                            {status && (
                                <div className={`flex items-center gap-3 p-4 rounded-2xl text-xs font-bold uppercase tracking-widest ${status.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                                    }`}>
                                    {status.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                                    {status.message}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || name === user.displayName}
                                className="w-full flex items-center justify-center gap-3 rounded-full bg-black py-5 text-xs font-bold uppercase tracking-widest text-white active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale"
                            >
                                {loading ? "Saving..." : "Save Changes"}
                                <Save size={16} />
                            </button>
                        </form>
                    </section>

                    <section className="pt-12 border-t border-zinc-100">
                        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-8">Account Actions</h2>
                        <div className="space-y-4">

                            <button
                                onClick={() => setIsDeleteModalOpen(true)}
                                className="w-full text-left p-6 rounded-3xl border border-red-50 hover:bg-red-50 transition-colors group">
                                <h3 className="text-sm font-bold uppercase tracking-widest mb-1 text-red-600">Delete Account</h3>
                                <p className="text-xs text-red-400">Permanently remove your account and all data.</p>
                            </button>
                        </div>
                    </section>
                </div>
            </div>

            {/* Delete Account Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
                    <div className="w-full max-w-md bg-white rounded-[40px] p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600">
                                <Trash2 size={24} />
                            </div>
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="h-10 w-10 rounded-full hover:bg-zinc-100 flex items-center justify-center transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <h3 className="font-empire text-3xl mb-4">Wait, don&apos;t go!</h3>
                        <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
                            Deleting your account is permanent. This will remove your profile, order history, and saved data. To confirm, please type <span className="font-bold text-black select-none">&quot;bye bactify&quot;</span> below.
                        </p>

                        <div className="space-y-6">
                            <input
                                type="text"
                                placeholder="Type 'bye bactify' to confirm"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value.toLowerCase())}
                                className="w-full border-b border-zinc-200 py-4 text-sm focus:border-red-600 outline-none transition-colors bg-transparent placeholder:text-zinc-300"
                            />

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={confirmText !== "bye bactify" || isDeleting}
                                    className="w-full bg-red-600 text-white rounded-full py-5 text-xs font-bold uppercase tracking-widest disabled:opacity-20 disabled:grayscale transition-all active:scale-[0.98]"
                                >
                                    {isDeleting ? "Deleting..." : "Permanently Delete Account"}
                                </button>
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="w-full bg-transparent text-zinc-400 py-4 text-xs font-bold uppercase tracking-widest hover:text-black transition-colors"
                                >
                                    I&apos;ve changed my mind
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
