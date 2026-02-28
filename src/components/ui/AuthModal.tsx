"use client";

import { useState } from "react";
import { X, Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    signInWithPopup
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { EMAIL_REGEX, PASSWORD_REGEX, NAME_REGEX, OTP_REGEX } from "@/lib/validation";
import { getFriendlyErrorMessage } from "@/lib/error-messages";
import { OTPInput } from "./OTPInput";
import { sendSignupOTP, verifySignupOTP } from "@/actions/auth";


type AuthMode = "signin" | "signup";

export function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [mode, setMode] = useState<AuthMode>("signin");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<"details" | "otp">("details");
    const [otp, setOtp] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Regex Validations
        if (mode === "signup" && !NAME_REGEX.test(name)) {
            setError("Please enter a valid name (2-50 characters)");
            return;
        }

        if (!EMAIL_REGEX.test(email)) {
            setError("Please enter a valid email address");
            return;
        }

        if (mode === "signup" && !PASSWORD_REGEX.test(password)) {
            setError("Password must be at least 8 characters and include both letters and numbers");
            return;
        }

        setLoading(true);
        try {
            if (mode === "signin") {
                await signInWithEmailAndPassword(auth, email, password);
                toast.success("Welcome to Blactify");
                onClose();
            } else {
                if (step === "details") {
                    const result = await sendSignupOTP(email);
                    if (result.success) {
                        setStep("otp");
                        toast.success("Verification code sent to your email");
                    } else {
                        setError(result.error || "Failed to send verification code");
                    }
                } else {
                    // Verify OTP first
                    if (!OTP_REGEX.test(otp)) {
                        setError("Please enter a valid 6-character code");
                        setLoading(false);
                        return;
                    }

                    const verification = await verifySignupOTP(email, otp);
                    if (!verification.success) {
                        setError(verification.error || "Invalid verification code");
                        setLoading(false);
                        return;
                    }

                    // OTP Verified, create account
                    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                    await updateProfile(userCredential.user, { displayName: name });
                    toast.success("Account created successfully!");
                    onClose();
                }
            }
        } catch (err: unknown) {
            setError(getFriendlyErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError("");
        setLoading(true);
        try {
            await signInWithPopup(auth, googleProvider);
            toast.success("Welcome to Blactify");
            onClose();
        } catch (err: unknown) {
            setLoading(false); // Clear loading immediately
            setError(getFriendlyErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div
                className={cn(
                    "fixed inset-0 z-[150] bg-black/60 transition-opacity",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />
            <div
                className={cn(
                    "fixed inset-x-0 bottom-0 z-[160] mx-auto w-full max-w-md bg-white rounded-t-[40px] shadow-[0_-20px_50px_rgba(0,0,0,0.2)] transition-transform duration-500 ease-in-out",
                    isOpen ? "translate-y-0" : "translate-y-full"
                )}
            >
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="font-empire text-3xl">
                            {mode === "signin" ? "Login" : "Sign Up"}
                        </h2>
                        <button aria-label="Close" onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 font-sans">
                        {mode === "signin" ? (
                            <>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 text-zinc-400" size={18} />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full border-b border-zinc-200 py-3 pl-10 text-sm focus:border-black outline-none transition-colors"
                                            placeholder="name@example.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 text-zinc-400" size={18} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full border-b border-zinc-200 py-3 pl-10 pr-10 text-sm focus:border-black outline-none transition-colors"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-3 text-zinc-400 hover:text-black transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : step === "details" ? (
                            <>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 text-zinc-400" size={18} />
                                        <input
                                            type="text"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full border-b border-zinc-200 py-3 pl-10 text-sm focus:border-black outline-none transition-colors"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 text-zinc-400" size={18} />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full border-b border-zinc-200 py-3 pl-10 text-sm focus:border-black outline-none transition-colors"
                                            placeholder="name@example.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 text-zinc-400" size={18} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full border-b border-zinc-200 py-3 pl-10 pr-10 text-sm focus:border-black outline-none transition-colors"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-3 text-zinc-400 hover:text-black transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-6 pt-4">
                                <div className="text-center space-y-2">
                                    <p className="text-sm text-zinc-500 font-medium">Verify your email</p>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Sent to {email}</p>
                                </div>
                                <div className="py-4">
                                    <OTPInput
                                        length={6}
                                        disabled={loading}
                                        onComplete={(code) => setOtp(code)}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setStep("details")}
                                    className="w-full text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-black transition-colors"
                                >
                                    Edit details
                                </button>
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="shrink-0 h-1.5 w-1.5 bg-red-500 rounded-full" />
                                <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest leading-relaxed">
                                    {error}
                                </p>
                            </div>
                        )}

                        <button
                            disabled={loading || (mode === "signup" && step === "otp" && otp.length < 6)}
                            className="w-full flex items-center justify-center gap-2 rounded-full bg-black py-4 text-xs font-bold uppercase tracking-widest text-white active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {loading ? "Processing..." : mode === "signin" ? "Login" : step === "details" ? "Join Now" : "Verify & Join"}
                            {!loading && <ArrowRight size={16} />}
                        </button>

                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-zinc-100"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-zinc-500 font-bold tracking-widest">Or continue with</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 rounded-full border border-zinc-200 py-4 text-xs font-bold uppercase tracking-widest text-black hover:bg-zinc-50 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Google
                        </button>

                        <p className="text-center text-xs text-zinc-500">
                            {mode === "signin" ? (
                                <>
                                    Don&apos;t have an account?{" "}
                                    <button type="button" onClick={() => setMode("signup")} className="font-bold text-black underline">Sign Up</button>
                                </>
                            ) : (
                                <>
                                    Already have an account?{" "}
                                    <button type="button" onClick={() => setMode("signin")} className="font-bold text-black underline">Login</button>
                                </>
                            )}
                        </p>
                    </form>
                </div>
            </div>
        </>
    );
}
