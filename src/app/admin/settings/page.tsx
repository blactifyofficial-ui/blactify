"use client";

import { useState, useEffect } from "react";
import { AdminPageHeader, AdminCard } from "@/components/admin/AdminUI";
import { User, Mail, Phone, MapPin, Building, ShieldCheck, Save } from "lucide-react";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [adminData, setAdminData] = useState({
        name: "Blactify Admin",
        email: "",
        phone: "+91 98765 43210",
        address: "Bengaluru, India",
        company: "Blactify Essentials",
        role: "Super Admin",
        joinedDate: "Mar 2024",
    });

    useEffect(() => {
        const user = auth.currentUser;
        if (user) {
            setAdminData(prev => ({
                ...prev,
                email: user.email || "",
                name: user.displayName || user.email?.split('@')[0] || "Admin",
            }));
        }
        setLoading(false);
    }, []);

    const handleSave = async () => {
        setSaving(true);
        // Simulate save
        await new Promise(r => setTimeout(r, 1000));
        toast.success("Admin details updated successfully", {
            description: "Changes are now live across all platforms.",
            className: "font-inter"
        });
        setSaving(false);
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <AdminPageHeader 
                title="Admin Details" 
                subtitle="Manage administrative identity and contact information"
            >
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-3 px-8 py-3 bg-black text-white hover:bg-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50"
                >
                    <Save size={16} />
                    {saving ? "Saving..." : "Save Changes"}
                </button>
            </AdminPageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Profile Card */}
                <div className="lg:col-span-1 border-r border-zinc-100 pr-0 lg:pr-8">
                    <AdminCard 
                        title="Identity" 
                        subtitle="Public facing administrator info"
                        className="sticky top-10"
                    >
                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="w-24 h-24 rounded-[2rem] bg-zinc-100 border border-zinc-200 flex items-center justify-center text-2xl font-black text-zinc-400">
                                {adminData.name.charAt(0)}
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-heading text-black uppercase">{adminData.name}</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#2AABEE]">{adminData.role}</p>
                            </div>
                            
                            <div className="w-full pt-6 border-t border-zinc-50 space-y-4">
                                <div className="flex justify-between items-center text-[11px]">
                                    <span className="text-zinc-400 font-bold uppercase tracking-widest">Status</span>
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full font-black uppercase tracking-[0.1em]">Active</span>
                                </div>
                                <div className="flex justify-between items-center text-[11px]">
                                    <span className="text-zinc-400 font-bold uppercase tracking-widest">Member Since</span>
                                    <span className="text-zinc-900 font-black">{adminData.joinedDate}</span>
                                </div>
                            </div>
                        </div>
                    </AdminCard>
                </div>

                {/* Right Column - Forms */}
                <div className="lg:col-span-2 space-y-8">
                    <AdminCard title="Core Information">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                    <User size={12} /> Full Name
                                </label>
                                <input 
                                    type="text" 
                                    value={adminData.name}
                                    onChange={e => setAdminData({...adminData, name: e.target.value})}
                                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-[13px] font-medium focus:outline-none focus:ring-1 focus:ring-black transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                    <Building size={12} /> Company Name
                                </label>
                                <input 
                                    type="text" 
                                    value={adminData.company}
                                    onChange={e => setAdminData({...adminData, company: e.target.value})}
                                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-[13px] font-medium focus:outline-none focus:ring-1 focus:ring-black transition-all"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                    <Mail size={12} /> Email Address
                                </label>
                                <input 
                                    type="email" 
                                    readOnly
                                    value={adminData.email}
                                    className="w-full bg-zinc-100/50 border border-zinc-100 rounded-2xl px-6 py-4 text-[13px] font-medium text-zinc-500 cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </AdminCard>

                    <AdminCard title="Security & Contact" subtitle="Used for alerts and high-level notifications">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                    <Phone size={12} /> Contact Phone
                                </label>
                                <input 
                                    type="text" 
                                    value={adminData.phone}
                                    onChange={e => setAdminData({...adminData, phone: e.target.value})}
                                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-[13px] font-medium focus:outline-none focus:ring-1 focus:ring-black transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                    <MapPin size={12} /> Business Address
                                </label>
                                <textarea 
                                    rows={1}
                                    value={adminData.address}
                                    onChange={e => setAdminData({...adminData, address: e.target.value})}
                                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-[13px] font-medium focus:outline-none focus:ring-1 focus:ring-black transition-all resize-none"
                                />
                            </div>
                        </div>
                    </AdminCard>

                    <div className="p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100 flex items-center justify-between group">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-red-500">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h4 className="text-[11px] font-black uppercase tracking-widest">Two-Factor Authentication</h4>
                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Managed via Firebase Console</p>
                            </div>
                        </div>
                        <span className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] opacity-30 group-hover:opacity-100 transition-opacity cursor-pointer">
                            Settings
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
