"use client";

import { useState } from "react";
import { useAuth } from "@/store/AuthContext";
import { auth } from "@/lib/firebase";
import { updateProfile, signOut } from "firebase/auth";
import { syncUserProfile } from "@/lib/profile-client";
import { ChevronLeft, User, Mail, Check, AlertCircle, Save, X, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCartStore } from "@/store/useCartStore";
import { NameSchema } from "@/lib/validation";
import { getFriendlyErrorMessage } from "@/lib/error-messages";


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
        if (confirmText !== "bye blactify studio" || !user) return;

        setIsDeleting(true);
        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/user/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
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
        } catch (err: unknown) {
            toast.error(getFriendlyErrorMessage(err));
        } finally {
            setIsDeleting(false);
            setConfirmText("");
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth.currentUser) return;

        if (!NameSchema.safeParse(name).success) {
            setStatus({ type: 'error', message: 'Please enter a valid name (2-50 characters)' });
            return;
        }

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
        } catch (err: unknown) {
            setStatus({ type: 'error', message: getFriendlyErrorMessage(err) });
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-black">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center bg-black">
                <h1 className="font-empire text-3xl mb-4 text-white">Access Denied</h1>
                <p className="text-zinc-500 mb-8">Please sign in to access settings.</p>
                <Link href="/profile" className="bg-white text-black px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all">
                    Go to Login
                </Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-black text-white pb-20 pt-8">
            <div className="px-6 max-w-lg mx-auto">
                <header className="mb-10">
                    <Link href="/profile" className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-6 text-xs font-bold uppercase tracking-widest">
                        <ChevronLeft size={16} />
                        Back to Profile
                    </Link>
                    <h1 className="font-empire text-5xl text-white">Settings</h1>
                </header>

                <div className="space-y-12">
                    <section>
                        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-8">Personal Information</h2>

                        <form onSubmit={handleUpdateProfile} className="space-y-8">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Display Name</label>
                                <div className="relative">
                                    <User className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full border-b border-white/10 py-4 pl-8 text-sm focus:border-white outline-none transition-colors bg-transparent text-white placeholder:text-zinc-700"
                                        placeholder="Full Name"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-700" size={18} />
                                    <input
                                        type="email"
                                        disabled
                                        value={user.email || ""}
                                        className="w-full border-b border-white/5 py-4 pl-8 text-sm text-zinc-500 outline-none bg-transparent cursor-not-allowed"
                                    />
                                    <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                                        Verified
                                    </span>
                                </div>
                                <p className="text-[10px] text-zinc-600 mt-2">Email cannot be changed for security reasons.</p>
                            </div>

                            {status && (
                                <div className={`flex items-center gap-3 p-4 rounded-2xl text-xs font-bold uppercase tracking-widest ${status.type === 'success' ? 'bg-white text-black shadow-xl' : 'border-2 border-white bg-black text-white'
                                    }`}>
                                    {status.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                                    {status.message}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || name === user.displayName}
                                className="w-full flex items-center justify-center gap-3 rounded-full bg-white py-5 text-xs font-bold uppercase tracking-widest text-black active:scale-[0.98] transition-all hover:bg-zinc-200 disabled:opacity-30 disabled:grayscale"
                            >
                                {loading ? "Saving..." : "Save Changes"}
                                <Save size={16} />
                            </button>
                        </form>
                    </section>

                    <section className="pt-12 border-t border-white/10">
                        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-8">Account Actions</h2>
                        <div className="space-y-4">

                            <button
                                onClick={() => setIsDeleteModalOpen(true)}
                                className="w-full text-left p-6 rounded-3xl border border-white/10 hover:border-white transition-colors group">
                                <h3 className="text-sm font-bold uppercase tracking-widest mb-1 text-white">Delete Account</h3>
                                <p className="text-xs text-zinc-500">Permanently remove your account and all data.</p>
                            </button>
                        </div>
                    </section>
                </div>
            </div>

            {/* Delete Account Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
                    <div className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-[40px] p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-black">
                                <Trash2 size={24} />
                            </div>
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="h-10 w-10 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <h3 className="font-empire text-3xl mb-4 text-white">Wait, don&apos;t go!</h3>
                        <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
                            Deleting your account is permanent. This will remove your profile, order history, and saved data. To confirm, please type <span className="font-bold text-white select-none">&quot;bye blactify studio&quot;</span> below.
                        </p>

                        <div className="space-y-6">
                            <input
                                type="text"
                                placeholder="Type 'bye blactify studio' to confirm"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value.toLowerCase())}
                                onPaste={(e) => e.preventDefault()}
                                className="w-full border-b border-white/10 py-4 text-sm focus:border-white outline-none transition-colors bg-transparent placeholder:text-zinc-700 text-white"
                            />

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={confirmText !== "bye blactify studio" || isDeleting}
                                    className="w-full bg-white text-black rounded-full py-5 text-xs font-bold uppercase tracking-widest disabled:opacity-20 disabled:grayscale transition-all hover:bg-zinc-200 active:scale-[0.98]"
                                >
                                    {isDeleting ? "Deleting..." : "Permanently Delete Account"}
                                </button>
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="w-full bg-transparent text-zinc-500 py-4 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
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
