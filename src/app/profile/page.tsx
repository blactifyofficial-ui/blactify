"use client";

import { useAuth } from "@/store/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { User, Package, Settings, LogOut, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

export default function ProfilePage() {
    const { user, loading } = useAuth();

    if (loading) return null;

    if (!user) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center font-sans">
                <div className="mb-6 rounded-full bg-zinc-100 p-6">
                    <User size={48} className="text-zinc-300" />
                </div>
                <h1 className="font-empire text-3xl mb-2 text-black">Member Profile</h1>
                <p className="mb-8 text-zinc-500">Sign in to track orders, manage your bag, and more.</p>
                <button
                    onClick={() => {
                        window.dispatchEvent(new CustomEvent('open-auth-modal'));
                    }}
                    className="w-full max-w-xs bg-black py-4 text-sm font-bold uppercase tracking-widest text-white transition-transform active:scale-[0.98]"
                >
                    Sign In / Join Us
                </button>
            </div>
        );
    }

    const menuItems = [
        { icon: Package, label: "Orders", href: "/orders" },
        { icon: Settings, label: "Account Settings", href: "/settings" },
    ];

    return (
        <div className="px-6 py-12 font-sans bg-white min-h-screen">
            <div className="flex items-center gap-4 mb-12">
                <div className="relative h-20 w-20 overflow-hidden rounded-full bg-zinc-100">
                    {user.photoURL ? (
                        <Image src={user.photoURL} alt={user.displayName || "User"} fill className="object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-zinc-300">
                            <User size={32} />
                        </div>
                    )}
                </div>
                <div>
                    <h1 className="font-empire text-3xl leading-none text-black">{user.displayName || "Member"}</h1>
                    <p className="text-sm text-zinc-400 mt-1">{user.email}</p>
                </div>
            </div>

            <div className="space-y-4">
                {menuItems.map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        className="flex w-full items-center justify-between border-b border-zinc-50 py-4 group text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-50 text-zinc-500 group-hover:bg-black group-hover:text-white transition-colors">
                                <item.icon size={20} />
                            </div>
                            <span className="text-sm font-bold uppercase tracking-widest text-black">{item.label}</span>
                        </div>
                        <ChevronRight size={18} className="text-zinc-300" />
                    </Link>
                ))}

                <button
                    onClick={async () => {
                        await signOut(auth);
                        toast.success("Signed out successfully");
                    }}
                    className="flex w-full items-center gap-4 py-4 text-red-500 mt-8"
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
                        <LogOut size={20} />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-widest">Sign Out</span>
                </button>
            </div>
        </div>
    );
}
