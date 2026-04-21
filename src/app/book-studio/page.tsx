"use client";

import { useState } from "react";
import { User, Phone, Calendar, Camera, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createStudioBooking } from "@/actions/studio";
import { BaseButton } from "@/components/ui/BaseButton";
import { z } from "zod";
import { StudioBookingSchema } from "@/lib/schemas";

const PHOTO_TYPES = [
    { id: "model_shoot", label: "Model Shoot", description: "Professional photography with models" },
    { id: "product_shoot", label: "Product Shoot", description: "High-quality imagery for products" },
    { id: "other", label: "Custom", description: "Tell us about your unique needs" },
] as const;

export default function BookStudioPage() {
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        booking_date: "",
        start_time: "",
        duration: "1hr",
        photo_type: "model_shoot" as typeof PHOTO_TYPES[number]["id"],
        query: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        // Client-side validation
        const validation = StudioBookingSchema.safeParse(formData);
        if (!validation.success) {
            const newErrors: Record<string, string> = {};
            validation.error.issues.forEach((issue) => {
                const field = issue.path[0]?.toString();
                if (field) {
                    newErrors[field] = issue.message;
                }
            });
            setErrors(newErrors);
            toast.error("Please fix the errors in the form.");
            return;
        }

        setLoading(true);
        try {
            const result = await createStudioBooking(formData);
            if (result.success) {
                setSubmitted(true);
                toast.success("Booking request sent successfully!");
            } else {
                toast.error(result.error || "Failed to send booking request");
            }
        } catch (err) {
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-6">
                <div className="max-w-md w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex justify-center">
                        <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center text-white">
                            <CheckCircle2 size={40} />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-3xl font-yapari uppercase tracking-tighter">Request Received</h1>
                        <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                            Thank you, {formData.name}. Our studio team has been notified. 
                            We will review your request and contact you via WhatsApp shortly to confirm availability.
                        </p>
                    </div>
                    <BaseButton variant="outline" onClick={() => window.location.href = "/"} className="w-full py-6 uppercase tracking-widest text-xs font-bold">
                        Back to Home
                    </BaseButton>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-6 pt-12 pb-12 md:pt-16 md:pb-20">
                <div className="max-w-3xl">
                    <h1 className="text-4xl md:text-6xl font-yapari uppercase tracking-tighter leading-none mb-6">
                        Blactify <span className="text-zinc-300">Studio</span>
                    </h1>
                    <p className="text-zinc-500 font-medium text-sm md:text-base max-w-xl">
                        Elevate your brand with professional photography. 
                        Book our premium studio space and expert team for your next production.
                    </p>
                </div>
            </div>

            {/* Form Section */}
            <div className="max-w-7xl mx-auto px-6 pb-24">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-x-20 gap-y-12 items-start">
                    {/* 01. Professional Details */}
                    <div className="space-y-8 lg:order-1">
                        <h2 className="text-xs font-yapari font-bold uppercase tracking-[0.2em] text-zinc-400 border-b border-zinc-100 pb-4">
                            01. Professional Details
                        </h2>
                        <div className="space-y-6">
                            <div className="space-y-2 group">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 group-focus-within:text-black transition-colors">
                                    Full Name / Brand Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-black transition-colors" size={18} />
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => {
                                            setFormData({ ...formData, name: e.target.value });
                                            if (errors.name) setErrors(prev => ({ ...prev, name: "" }));
                                        }}
                                        className="w-full bg-transparent border-b border-zinc-200 py-4 pl-8 text-sm focus:border-black outline-none transition-all placeholder:text-zinc-200"
                                        placeholder="Enter your name"
                                    />
                                </div>
                                {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-wider">{errors.name}</p>}
                            </div>

                            <div className="space-y-2 group">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 group-focus-within:text-black transition-colors">
                                    WhatsApp Number
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-black transition-colors" size={18} />
                                    <input
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => {
                                            setFormData({ ...formData, phone: e.target.value });
                                            if (errors.phone) setErrors(prev => ({ ...prev, phone: "" }));
                                        }}
                                        className="w-full bg-transparent border-b border-zinc-200 py-4 pl-8 text-sm focus:border-black outline-none transition-all placeholder:text-zinc-200"
                                        placeholder="+91 00000 00000"
                                    />
                                </div>
                                {errors.phone && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-wider">{errors.phone}</p>}
                            </div>
                        </div>
                    </div>

                    {/* 02. Visual Style (Now second on mobile, stays right on desktop) */}
                    <div className="space-y-8 lg:order-2 lg:row-span-3">
                        <h2 className="text-xs font-yapari font-bold uppercase tracking-[0.2em] text-zinc-400 border-b border-zinc-100 pb-4">
                            02. Visual Style
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {PHOTO_TYPES.map((type) => (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, photo_type: type.id })}
                                    className={cn(
                                        "text-left p-6 border transition-all duration-300 space-y-3 group",
                                        formData.photo_type === type.id 
                                            ? "border-black bg-black text-white shadow-xl translate-y-[-4px]" 
                                            : "border-zinc-100 bg-zinc-50/50 hover:border-zinc-300 text-zinc-900"
                                    )}
                                >
                                    <div className="flex justify-between items-start">
                                        <Camera 
                                            size={20} 
                                            className={cn(
                                                "transition-colors",
                                                formData.photo_type === type.id ? "text-white" : "text-zinc-400 group-hover:text-black"
                                            )} 
                                        />
                                        {formData.photo_type === type.id && <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
                                    </div>
                                    <div>
                                        <div className={cn(
                                            "text-lg font-yapari font-bold uppercase tracking-widest",
                                            formData.photo_type === type.id ? "text-white!" : "text-black!"
                                        )}>
                                            {type.label}
                                        </div>
                                        <p className={cn(
                                            "text-[10px] mt-1 font-medium leading-relaxed",
                                            formData.photo_type === type.id ? "text-zinc-400" : "text-zinc-500"
                                        )}>
                                            {type.description}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 03. Schedule */}
                    <div className="space-y-8 lg:order-3">
                        <h2 className="text-xs font-yapari font-bold uppercase tracking-[0.2em] text-zinc-400 border-b border-zinc-100 pb-4">
                            03. Preferred Schedule
                        </h2>
                        <div className="space-y-6">
                            <div className="space-y-2 group">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 group-focus-within:text-black transition-colors">
                                    Requested Date
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-black transition-colors" size={18} />
                                    <input
                                        type="date"
                                        required
                                        min={new Date().toISOString().split("T")[0]}
                                        value={formData.booking_date}
                                        onChange={(e) => {
                                            setFormData({ ...formData, booking_date: e.target.value });
                                            if (errors.booking_date) setErrors(prev => ({ ...prev, booking_date: "" }));
                                        }}
                                        className="w-full bg-transparent border-b border-zinc-200 py-4 pl-8 text-sm focus:border-black outline-none transition-all appearance-none"
                                    />
                                </div>
                                {errors.booking_date && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-wider">{errors.booking_date}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2 group">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 group-focus-within:text-black transition-colors">
                                        Starting Time
                                    </label>
                                    <div className="relative">
                                        <Clock className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-black transition-colors" size={18} />
                                        <input
                                            type="time"
                                            required
                                            value={formData.start_time}
                                            onChange={(e) => {
                                                setFormData({ ...formData, start_time: e.target.value });
                                                if (errors.start_time) setErrors(prev => ({ ...prev, start_time: "" }));
                                            }}
                                            className="w-full bg-transparent border-b border-zinc-200 py-4 pl-8 text-sm focus:border-black outline-none transition-all appearance-none"
                                        />
                                    </div>
                                    {errors.start_time && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-wider">{errors.start_time}</p>}
                                </div>

                                <div className="space-y-2 group">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 group-focus-within:text-black transition-colors">
                                        Time Frame
                                    </label>
                                    <select
                                        value={formData.duration}
                                        onChange={(e) => {
                                            setFormData({ ...formData, duration: e.target.value });
                                            if (errors.duration) setErrors(prev => ({ ...prev, duration: "" }));
                                        }}
                                        className="w-full bg-transparent border-b border-zinc-200 py-4 text-sm focus:border-black outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="1hr">1 Hour</option>
                                        <option value="2hr">2 Hours</option>
                                        <option value="3hr">3 Hours</option>
                                        <option value="4hr">4 Hours</option>
                                        <option value="5hr">5 Hours</option>
                                        <option value="8hr">Full Day (8hrs)</option>
                                    </select>
                                    {errors.duration && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-wider">{errors.duration}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 04. Additional Requirements */}
                    <div className="space-y-8 lg:order-4">
                        <h2 className="text-xs font-yapari font-bold uppercase tracking-[0.2em] text-zinc-400 border-b border-zinc-100 pb-4">
                            04. Additional Requirements
                        </h2>
                        <div className="space-y-2 group">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 group-focus-within:text-black transition-colors">
                                Query / Special Instructions
                            </label>
                            <textarea
                                value={formData.query}
                                onChange={(e) => {
                                    setFormData({ ...formData, query: e.target.value });
                                    if (errors.query) setErrors(prev => ({ ...prev, query: "" }));
                                }}
                                rows={3}
                                className="w-full bg-transparent border-b border-zinc-200 py-4 text-sm focus:border-black outline-none transition-all placeholder:text-zinc-200 resize-none"
                                placeholder="Describe your requirements or ask any questions..."
                            />
                            {errors.query && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-wider">{errors.query}</p>}
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="pt-8 lg:order-5">
                        <BaseButton 
                            type="submit" 
                            isLoading={loading}
                            className="w-full py-8 rounded-none bg-black text-white text-xs font-bold uppercase tracking-[0.3em] overflow-hidden group/btn relative"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                Request Booking <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                            </span>
                        </BaseButton>
                        <p className="text-[10px] text-zinc-400 text-center mt-6 uppercase tracking-widest font-medium">
                            By submitting, you agree to our studio terms of service.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
