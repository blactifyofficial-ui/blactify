"use client";

import { useCartStore } from "@/store/useCartStore";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, ShoppingBag, ArrowLeft, Smartphone, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/store/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { loadRazorpay } from "@/lib/razorpay";
import { saveOrder } from "@/lib/order-sync";
import { markWelcomeDiscountUsed } from "@/lib/profile-sync";
import { Tag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { getStoreSettings } from "@/app/actions/settings";
import {
    EMAIL_REGEX,
    PHONE_REGEX,
    PINCODE_REGEX,
    NAME_REGEX,
    ADDRESS_REGEX,
    CITY_REGEX
} from "@/lib/validation";
import { getFriendlyErrorMessage } from "@/lib/error-messages";


interface CartItem {
    id: string;
    cartId: string;
    name: string;
    price_base: number;
    price_offer?: number;
    quantity: number;
    size?: string;
    product_images?: { url: string }[];
    main_image: string | null; // For direct checkout items
}

interface ProductVariant {
    size: string;
    stock: number;
}

interface ProductWithVariants {
    id: string;
    name: string;
    product_variants: ProductVariant[];
}

interface RazorpaySuccessResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

// Helper component for robust image fallbacks
function SafeImage({ src, alt, className }: { src: string | null; alt: string; className?: string; fill?: boolean }) {
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const displaySrc = imgSrc || src || "/hero-placeholder.jpg";

    return (
        <Image
            key={src || "fallback"}
            src={displaySrc}
            alt={alt}
            fill
            className={cn("object-cover", className)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => setImgSrc("/hero-placeholder.jpg")}
        />
    );
}

function CheckoutContent() {
    const { items, getSubtotal, getTotalPrice, getShippingCharge, clearCart, removeItem, discountCode, applyDiscount, removeDiscount } = useCartStore();
    const router = useRouter();
    const { user } = useAuth();
    const [isMounted, setIsMounted] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showOrderSummary, setShowOrderSummary] = useState(false);
    const [discountInput, setDiscountInput] = useState("");
    const [stockErrors, setStockErrors] = useState<Record<string, string>>({});
    const [storeEnabled, setStoreEnabled] = useState(true);
    const [checkingStore, setCheckingStore] = useState(true);

    const searchParams = useSearchParams();
    const isDirect = searchParams.get("direct") === "true";
    const [directItem, setDirectItem] = useState<CartItem | null>(null);

    useEffect(() => {
        if (isDirect) {
            const item = sessionStorage.getItem("direct-checkout-item");
            if (item) {
                setDirectItem(JSON.parse(item));
            }
        }
    }, [isDirect]);

    const activeItems = (isDirect ? (directItem ? [directItem] : []) : items) as CartItem[];

    // Derived values
    const subtotal = isDirect
        ? activeItems.reduce((acc: number, item: CartItem) => acc + (item.price_offer || item.price_base) * item.quantity, 0)
        : getSubtotal();

    const shipping = isDirect
        ? (subtotal === 0 ? 0 : (subtotal < 2999 ? 59 : 0))
        : getShippingCharge();

    const total = isDirect
        ? (() => {
            let t = subtotal;
            if (discountCode === "WELCOME10") t = subtotal * 0.9;
            return t + shipping;
        })()
        : getTotalPrice();

    const discountAmount = isDirect
        ? (discountCode === "WELCOME10" ? subtotal * 0.1 : 0)
        : (subtotal - (total - shipping));

    const [formData, setFormData] = useState({
        email: user?.email || "",
        firstName: "",
        lastName: "",
        address: "",
        apartment: "",
        district: "",
        city: "",
        state: "",
        pincode: "",
        phone: "",
        secondaryPhone: ""
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        setIsMounted(true);
        if (user?.email) {
            setFormData(prev => ({ ...prev, email: user.email! }));
        }

        // Load saved form data
        const savedData = sessionStorage.getItem("checkout-form-data");
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                setFormData(prev => ({ ...prev, ...parsed }));
            } catch (err) {
                console.error("Failed to parse saved form data", err);
            }
        }

        // Check store status
        getStoreSettings().then(settings => {
            if (settings) {
                setStoreEnabled(settings.purchases_enabled);
            }
            setCheckingStore(false);
        });
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!EMAIL_REGEX.test(formData.email)) {
            newErrors.email = "Invalid email address";
        }

        // Phone validation
        if (!formData.phone.trim()) {
            newErrors.phone = "Phone number is required";
        } else if (!PHONE_REGEX.test(formData.phone)) {
            newErrors.phone = "Invalid phone number (10 digits starting with 6-9)";
        }

        // PIN Code validation
        if (!formData.pincode.trim()) {
            newErrors.pincode = "PIN code is required";
        } else if (!PINCODE_REGEX.test(formData.pincode)) {
            newErrors.pincode = "Invalid PIN code (6 digits)";
        }

        // Name validation
        if (!formData.firstName.trim()) {
            newErrors.firstName = "First name is required";
        } else if (!NAME_REGEX.test(formData.firstName)) {
            newErrors.firstName = "Invalid first name (2-50 characters)";
        }

        if (!formData.lastName.trim()) {
            newErrors.lastName = "Last name is required";
        } else if (!NAME_REGEX.test(formData.lastName)) {
            newErrors.lastName = "Invalid last name (2-50 characters)";
        }

        // Address validation
        if (!formData.address.trim()) {
            newErrors.address = "Address is required";
        } else if (!ADDRESS_REGEX.test(formData.address)) {
            newErrors.address = "Invalid address format or length (5-100 characters)";
        }

        // City & District validation
        if (!formData.district.trim()) {
            newErrors.district = "District is required";
        } else if (!CITY_REGEX.test(formData.district)) {
            newErrors.district = "Invalid district name";
        }

        if (!formData.city.trim()) {
            newErrors.city = "City is required";
        } else if (!CITY_REGEX.test(formData.city)) {
            newErrors.city = "Invalid city name";
        }

        if (!formData.state) newErrors.state = "State is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateCartStock = async () => {
        try {
            const productIds = activeItems.map(item => item.id);
            const { data: currentProducts, error } = await supabase
                .from("products")
                .select("id, name, product_variants(size, stock)")
                .in("id", productIds);

            if (error) throw error;

            const newStockErrors: Record<string, string> = {};
            let hasErrors = false;

            activeItems.forEach(item => {
                const currentProduct = currentProducts?.find((p: ProductWithVariants) => p.id === item.id);
                if (!currentProduct) {
                    newStockErrors[item.cartId] = "Product no longer available";
                    hasErrors = true;
                } else {
                    let availableStock = 0;
                    if (item.size) {
                        const variant = currentProduct.product_variants?.find((v: ProductVariant) => v.size === item.size);
                        availableStock = variant?.stock ?? 0;
                    } else {
                        availableStock = currentProduct.product_variants?.reduce((acc: number, v: ProductVariant) => acc + v.stock, 0) || 0;
                    }

                    if (availableStock < item.quantity) {
                        newStockErrors[item.cartId] = availableStock === 0
                            ? "Out of stock"
                            : `Only ${availableStock} left`;
                        hasErrors = true;
                    }
                }
            });

            setStockErrors(newStockErrors);
            return !hasErrors;
        } catch (err: unknown) {
            toast.error("Stock Verification Error", { description: getFriendlyErrorMessage(err) });
            return true; // Proceed if error occurs, but log it
        }
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Validate Form
        if (!validateForm()) {
            const firstErrorField = document.querySelector('.text-red-500');
            if (firstErrorField) {
                firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        // 2. Validate Stock again right before payment
        const isStockValid = await validateCartStock();
        if (!isStockValid) {
            toast.error("Stock Verification Error", { description: "Failed to confirm availability." });
            toast.error("Some items in your bag are no longer available in the requested quantity.");
            return;
        }

        setIsProcessing(true);

        try {
            // 1. Create order on server
            const response = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: total,
                    currency: "INR",
                    receipt: `receipt_${Date.now()}`,
                }),
            });

            const order = await response.json();

            if (!order.id) {
                throw new Error("order-creation-failed");
            }

            // 2. Load Razorpay script
            const isLoaded = await loadRazorpay();
            if (!isLoaded) {
                throw new Error("Razorpay SDK failed to load");
            }

            // 3. Initialize Razorpay options
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: "Blactify",
                description: "Purchase from Blactify",
                order_id: order.id,
                handler: async function (razorpayResponse: RazorpaySuccessResponse) {
                    // Payment Success
                    try {
                        // Save order to Supabase
                        const saveResult = await saveOrder({
                            razorpay_order_id: razorpayResponse.razorpay_order_id,
                            razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                            user_id: user?.uid || "guest",
                            amount: total,
                            currency: "INR",
                            items: activeItems,
                            status: "paid",
                            shipping_address: {
                                line1: formData.address,
                                line2: formData.apartment || formData.district || undefined,
                                city: formData.city,
                                state: formData.state,
                                postal_code: formData.pincode,
                                country: "India"
                            },
                            customer_details: {
                                name: `${formData.firstName} ${formData.lastName}`.trim(),
                                email: formData.email,
                                phone: formData.phone,
                                secondary_phone: formData.secondaryPhone || undefined
                            },
                            payment_details: {
                                razorpay_order_id: razorpayResponse.razorpay_order_id,
                                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                                razorpay_signature: razorpayResponse.razorpay_signature,
                                method: "Razorpay",
                                timestamp: new Date().toISOString()
                            }
                        });

                        if (saveResult.success) {
                            if (discountCode === "WELCOME10" && user) {
                                await markWelcomeDiscountUsed(user.uid);
                            }

                            if (isDirect) {
                                sessionStorage.removeItem("direct-checkout-item");
                            } else {
                                clearCart();
                            }

                            removeDiscount();
                            sessionStorage.removeItem("checkout-form-data");
                            router.push(`/checkout/success?order_id=${razorpayResponse.razorpay_order_id}`);
                        } else {

                            const errorObj = saveResult.error as { message?: string; technical?: string };
                            const errorMessage = errorObj?.message || "Something went wrong while saving your order.";
                            toast.error(errorMessage, {
                                duration: 6000,
                                description: errorObj?.technical ? "Technical detail: " + errorObj.technical : undefined
                            });
                        }
                    } catch (err: unknown) {
                        toast.error("Order process error", { description: getFriendlyErrorMessage(err) });
                    }
                },
                prefill: {
                    name: `${formData.firstName} ${formData.lastName}`.trim(),
                    email: formData.email,
                    contact: formData.phone,
                },
                theme: {
                    color: "#333639",
                },
                modal: {
                    ondismiss: function () {
                        setIsProcessing(false);
                        const failureUrl = isDirect ? "/checkout/failure?direct=true" : "/checkout/failure";
                        sessionStorage.setItem("checkout-form-data", JSON.stringify(formData));
                        router.push(failureUrl);
                    },
                },
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();

            paymentObject.on("payment.failed", function () {

                // Attempt to close the modal programmatically
                try {
                    paymentObject.close();
                } catch {
                    // Ignore error if modal is already closed or cannot be closed
                }
                const failureUrl = isDirect ? "/checkout/failure?direct=true" : "/checkout/failure";
                sessionStorage.setItem("checkout-form-data", JSON.stringify(formData));
                router.push(failureUrl);
            });

        } catch (err: unknown) {

            setIsProcessing(false);
            toast.error(getFriendlyErrorMessage(err));
        }
    };

    if (!isMounted) return null;

    if (checkingStore) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!storeEnabled) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-white">
                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag className="text-zinc-400" size={24} />
                </div>
                <h1 className="text-xl font-medium mb-4 text-zinc-900 uppercase">Store is currently paused</h1>
                <p className="text-zinc-500 mb-8 max-w-md text-sm leading-relaxed">
                    We are currently updating our inventory or performing maintenance.
                    Please check back later to complete your purchase.
                </p>
                <Link href="/" className="bg-black text-white px-10 py-4 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-95">
                    Return to Home
                </Link>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-white">
                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-6">
                    <ShieldCheck className="text-zinc-400" size={24} />
                </div>
                <h1 className="text-xl font-medium mb-4 text-zinc-900 uppercase">Authentication Required</h1>
                <p className="text-zinc-500 mb-8 max-w-xs text-sm">Please log in to proceed with your order.</p>
                <button
                    onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal'))}
                    className="bg-black text-white px-10 py-4 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-95"
                >
                    Log In / Sign Up
                </button>
                <Link href="/shop" className="mt-6 text-zinc-400 text-[10px] font-bold uppercase tracking-widest hover:text-black transition-colors">
                    Back to Shop
                </Link>
            </div>
        );
    }

    if (activeItems.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-white">
                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag className="text-zinc-400" size={24} />
                </div>
                <h1 className="text-xl font-medium mb-4 text-zinc-900 uppercase">Your {isDirect ? 'Direct Checkout' : 'Bag'} is empty</h1>
                <Link href="/shop" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                    Return to Shop
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col md:flex-row">
            {/* Left Column - Main Content */}
            <div className="flex-1 flex flex-col md:justify-start md:items-end pt-8 pb-12 px-6 md:px-12 bg-white order-2 md:order-1">
                <div className="w-full max-w-[580px] md:pr-14 lg:pr-20 space-y-8">
                    {/* Header Logo */}
                    <div className="flex items-center justify-between">
                        <Link href="/" className="font-bold text-2xl tracking-tight text-zinc-900">Blactify</Link>
                        <Link href="/shop?openCart=true" className="md:hidden text-blue-600 text-sm">Bag</Link>
                    </div>

                    {/* Breadcrumbs */}
                    <nav className="flex items-center gap-2 text-xs text-zinc-500">
                        <Link href="/shop?openCart=true" className="hover:text-zinc-800 transition-colors">Bag</Link>
                        <span className="text-zinc-300">/</span>
                        <span className="font-medium text-zinc-900">Information</span>
                        <span className="text-zinc-300">/</span>
                        <span>Shipping</span>
                        <span className="text-zinc-300">/</span>
                        <span>Payment</span>
                    </nav>

                    {/* Mobile Order Summary Toggle */}
                    <div className="md:hidden border-y border-zinc-200 py-4 -mx-6 px-6 bg-zinc-50">
                        <button
                            onClick={() => setShowOrderSummary(!showOrderSummary)}
                            className="w-full flex items-center justify-between text-blue-600 text-sm font-medium"
                        >
                            <span className="flex items-center gap-2">
                                <span className="text-zinc-900">Show order summary</span>
                                {showOrderSummary ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </span>
                            <span className="text-zinc-900 font-medium">₹{total.toFixed(2)}</span>
                        </button>

                        {showOrderSummary && (
                            <div className="pt-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                {activeItems.map((item) => (
                                    <div key={item.cartId || item.id} className="flex gap-4">
                                        <div className="relative w-16 h-16 border border-zinc-200 rounded-lg bg-white overflow-hidden flex-shrink-0">
                                            <div className="absolute top-0 right-0 bg-zinc-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-bl-lg font-medium opacity-90 z-10">
                                                {item.quantity}
                                            </div>
                                            <SafeImage src={item.product_images?.[0]?.url || item.main_image} alt={item.name} fill className="object-cover" />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-center">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="text-sm font-medium text-zinc-900">{item.name}</h4>
                                                    {item.size && <p className="text-xs text-zinc-500">Size: {item.size.toUpperCase()}</p>}
                                                </div>
                                                {!isDirect && (
                                                    <button
                                                        onClick={() => removeItem(item.cartId)}
                                                        className="text-[10px] text-blue-600 hover:text-blue-800 transition-colors font-medium px-2 py-1 bg-zinc-100 rounded"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                            {stockErrors[item.cartId] && (
                                                <p className="text-[10px] text-red-500 font-bold mt-1 uppercase italic">
                                                    {stockErrors[item.cartId]}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex flex-col justify-center items-end">
                                            <span className="text-sm font-medium text-zinc-900">₹{((item.price_offer || item.price_base) * item.quantity).toFixed(2)}</span>
                                        </div>
                                    </div>
                                ))}
                                <div className="space-y-3 pt-4 border-t border-zinc-200/50">
                                    <div className="flex gap-2">
                                        <input
                                            placeholder="Discount code"
                                            value={discountInput}
                                            onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
                                            className="flex-1 h-12 px-4 rounded-md border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow placeholder:text-zinc-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (discountInput === "WELCOME10") {
                                                    applyDiscount("WELCOME10");
                                                    setDiscountInput("");
                                                } else {
                                                    toast.error("Invalid discount code");
                                                }
                                            }}
                                            className="h-12 px-6 bg-black text-white text-sm font-medium rounded-md hover:bg-zinc-800 transition-colors"
                                        >
                                            Apply
                                        </button>
                                    </div>

                                    {discountCode && (
                                        <div className="flex items-center justify-between py-2 px-3 bg-zinc-100 rounded-lg text-sm">
                                            <div className="flex items-center gap-2 text-zinc-900 font-medium uppercase tracking-wider text-[10px]">
                                                <Tag size={12} className="text-zinc-500" />
                                                {discountCode}
                                            </div>
                                            <button
                                                onClick={removeDiscount}
                                                className="text-[10px] text-zinc-400 hover:text-red-500 transition-colors uppercase font-bold tracking-tighter"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex justify-between text-sm text-zinc-600 pt-2">
                                        <span>Subtotal</span>
                                        <span>₹{subtotal.toFixed(2)}</span>
                                    </div>

                                    {discountCode && (
                                        <div className="flex justify-between text-sm text-blue-600">
                                            <span>Discount ({discountCode})</span>
                                            <span>-₹{discountAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm text-zinc-600">
                                        <span>Shipping</span>
                                        <span>{shipping === 0 ? "Free" : `₹${shipping.toFixed(2)}`}</span>
                                    </div>

                                    <div className="flex justify-between text-lg font-medium text-zinc-900 pt-2 border-t border-zinc-200/50">
                                        <span>Total</span>
                                        <span>INR ₹{total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handlePayment} className="space-y-8">
                        {/* Contact Section */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-medium text-zinc-900">Contact</h2>
                                {!user ? (
                                    <button
                                        type="button"
                                        onClick={() => window.dispatchEvent(new Event('open-auth-modal'))}
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                        Log in
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            signOut(auth);
                                            toast.success("Signed out! You can now log in with a different account.");
                                        }}
                                        className="text-xs text-zinc-400 hover:text-red-500 transition-colors uppercase font-bold tracking-widest"
                                    >
                                        Switch Account
                                    </button>
                                )}
                            </div>
                            <div className="space-y-2">
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    readOnly={!!user?.email}
                                    className={cn(
                                        "w-full h-12 px-4 rounded-md border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow placeholder:text-zinc-500",
                                        user?.email && "bg-zinc-50 text-zinc-500",
                                        errors.email && "border-red-500 focus:ring-red-500"
                                    )}
                                />
                                {user && (
                                    <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">
                                        Logged in as {user.displayName || "Member"}
                                    </p>
                                )}
                            </div>
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}

                        </section>

                        {/* Delivery Section */}
                        <section className="space-y-4">
                            <h2 className="text-lg font-medium text-zinc-900">Delivery</h2>
                            <div className="space-y-3">
                                <select className="w-full h-12 px-4 rounded-md border border-zinc-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow text-zinc-900" defaultValue="India">
                                    <option value="India">India</option>
                                </select>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <input
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            placeholder="First name"
                                            className={cn(
                                                "w-full h-12 px-4 rounded-md border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow placeholder:text-zinc-500",
                                                errors.firstName && "border-red-500 focus:ring-red-500"
                                            )}
                                        />
                                        {errors.firstName && <p className="text-red-500 text-xs">{errors.firstName}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <input
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            placeholder="Last name"
                                            className={cn(
                                                "w-full h-12 px-4 rounded-md border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow placeholder:text-zinc-500",
                                                errors.lastName && "border-red-500 focus:ring-red-500"
                                            )}
                                        />
                                        {errors.lastName && <p className="text-red-500 text-xs">{errors.lastName}</p>}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <input
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Address"
                                        className={cn(
                                            "w-full h-12 px-4 rounded-md border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow placeholder:text-zinc-500",
                                            errors.address && "border-red-500 focus:ring-red-500"
                                        )}
                                    />
                                    {errors.address && <p className="text-red-500 text-xs">{errors.address}</p>}
                                </div>

                                <input
                                    name="apartment"
                                    value={formData.apartment}
                                    onChange={handleChange}
                                    placeholder="Apartment, suite, etc. (optional)"
                                    className="w-full h-12 px-4 rounded-md border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow placeholder:text-zinc-500"
                                />

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <input
                                            name="district"
                                            value={formData.district}
                                            onChange={handleChange}
                                            placeholder="District"
                                            className={cn(
                                                "w-full h-12 px-4 rounded-md border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow placeholder:text-zinc-500",
                                                errors.district && "border-red-500 focus:ring-red-500"
                                            )}
                                        />
                                        {errors.district && <p className="text-red-500 text-xs">{errors.district}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <input
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            placeholder="City"
                                            className={cn(
                                                "w-full h-12 px-4 rounded-md border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow placeholder:text-zinc-500",
                                                errors.city && "border-red-500 focus:ring-red-500"
                                            )}
                                        />
                                        {errors.city && <p className="text-red-500 text-xs">{errors.city}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <select
                                            name="state"
                                            value={formData.state}
                                            onChange={handleChange}
                                            className={cn(
                                                "w-full h-12 px-4 rounded-md border border-zinc-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow text-zinc-900",
                                                errors.state && "border-red-500 focus:ring-red-500"
                                            )}
                                        >
                                            <option value="" disabled>State</option>
                                            <option value="MH">Maharashtra</option>
                                            <option value="KA">Karnataka</option>
                                            <option value="DL">Delhi</option>
                                            <option value="KL">Kerala</option>
                                            <option value="TN">Tamil Nadu</option>
                                        </select>
                                        {errors.state && <p className="text-red-500 text-xs">{errors.state}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <input
                                            name="pincode"
                                            value={formData.pincode}
                                            onChange={handleChange}
                                            placeholder="PIN code"
                                            className={cn(
                                                "w-full h-12 px-4 rounded-md border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow placeholder:text-zinc-500",
                                                errors.pincode && "border-red-500 focus:ring-red-500"
                                            )}
                                        />
                                        {errors.pincode && <p className="text-red-500 text-xs">{errors.pincode}</p>}
                                    </div>
                                </div>

                                <div className="relative space-y-1">
                                    <input
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="Phone"
                                        className={cn(
                                            "w-full h-12 px-4 rounded-md border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow placeholder:text-zinc-500",
                                            errors.phone && "border-red-500 focus:ring-red-500"
                                        )}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-lg pb-1">🇮🇳</div>
                                    {errors.phone && <p className="text-red-500 text-xs">{errors.phone}</p>}
                                </div>
                                <div className="relative">
                                    <input
                                        name="secondaryPhone"
                                        value={formData.secondaryPhone}
                                        onChange={handleChange}
                                        placeholder="Secondary Phone (Optional)"
                                        className="w-full h-12 px-4 rounded-md border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow placeholder:text-zinc-500"
                                    />
                                </div>


                            </div>
                        </section>



                        {/* Payment */}
                        <section className="space-y-4">
                            <div className="space-y-1">
                                <h2 className="text-lg font-medium text-zinc-900">Payment</h2>
                                <p className="text-sm text-zinc-500">All transactions are secure and encrypted.</p>
                            </div>

                            <div className="border border-zinc-300 rounded-md overflow-hidden">
                                <div className="p-4 bg-zinc-50 border-b border-zinc-300 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full border-[5px] border-blue-600 bg-white" />
                                        <span className="text-sm font-medium text-zinc-900">UPI</span>
                                    </div>
                                    <div className="flex gap-1">
                                        {/* Simple visualization of UPI apps */}
                                        <div className="w-8 h-5 bg-white border border-zinc-200 rounded flex items-center justify-center text-[8px] font-bold text-zinc-600">GPay</div>
                                        <div className="w-8 h-5 bg-white border border-zinc-200 rounded flex items-center justify-center text-[8px] font-bold text-zinc-600">PhPe</div>
                                        <div className="w-8 h-5 bg-white border border-zinc-200 rounded flex items-center justify-center text-[8px] font-bold text-zinc-600">Paytm</div>
                                    </div>
                                </div>
                                <div className="p-8 bg-zinc-50/30 flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="w-16 h-16 bg-white border border-zinc-200 rounded-md flex items-center justify-center">
                                        <Smartphone className="text-zinc-400" size={32} />
                                    </div>
                                    <p className="text-sm text-zinc-500 max-w-xs">
                                        After clicking &quot;Complete order&quot;, you will be redirected to complete your purchase securely.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Footer Actions */}
                        <div className="flex flex-col gap-4 pt-4">
                            {Object.keys(stockErrors).length > 0 && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                                    <p className="text-xs text-red-600 font-medium">
                                        Please remove out-of-stock items or adjust quantities to continue with your order.
                                    </p>
                                </div>
                            )}
                            <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-6">
                                <Link href="/shop?openCart=true" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                                    <ArrowLeft size={14} />
                                    Return to bag
                                </Link>
                                <button
                                    type="submit"
                                    disabled={isProcessing || Object.keys(stockErrors).length > 0}
                                    className={cn(
                                        "w-full md:w-auto px-8 py-4 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors shadow-sm",
                                        (isProcessing || Object.keys(stockErrors).length > 0) && "opacity-70 cursor-not-allowed"
                                    )}
                                >
                                    {isProcessing ? "Processing..." : Object.keys(stockErrors).length > 0 ? "Remove items to proceed" : "Complete order"}
                                </button>
                            </div>
                        </div>
                    </form>

                    {/* Legal Footer */}
                    <div className="pt-10 border-t border-zinc-200 mt-10">
                        <div className="flex gap-4 text-xs text-blue-600 underline">
                            <Link href="/policy/shipping">Shipping policy</Link>
                            <Link href="/policy/privacy">Privacy policy</Link>
                            <Link href="/policy/terms">Terms of service</Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column - Summary Sidebar (Desktop) */}
            <div className="hidden md:block flex-1 bg-zinc-50 border-l border-zinc-200 pt-8 px-6 lg:px-12 order-1 md:order-2">
                <div className="w-full max-w-[420px] lg:pl-10 space-y-6 sticky top-8">
                    {activeItems.map((item) => (
                        <div key={item.cartId || item.id} className="flex gap-4 items-center">
                            <div className="relative w-16 h-16 border border-zinc-200 rounded-lg bg-white overflow-hidden flex-shrink-0">
                                <div className="absolute top-0 right-0 bg-zinc-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-bl-lg font-medium opacity-90 z-10">
                                    {item.quantity}
                                </div>
                                <SafeImage src={item.product_images?.[0]?.url || item.main_image} alt={item.name} fill className="object-cover" />
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-sm font-medium text-zinc-900">{item.name}</h4>
                                        {item.size && <p className="text-xs text-zinc-500">Size: {item.size.toUpperCase()}</p>}
                                    </div>
                                    {!isDirect && (
                                        <button
                                            onClick={() => removeItem(item.cartId)}
                                            className="text-[10px] text-blue-600 hover:text-blue-800 transition-colors font-medium"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                                {stockErrors[item.cartId] && (
                                    <p className="text-[10px] text-red-500 font-bold mt-1 uppercase italic">
                                        {stockErrors[item.cartId]}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col justify-center items-end">
                                <span className="text-sm font-medium text-zinc-900">₹{((item.price_offer || item.price_base) * item.quantity).toFixed(2)}</span>
                            </div>
                        </div>
                    ))}

                    <div className="h-px w-full bg-zinc-200 my-4" />

                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <input
                                placeholder="Discount code"
                                value={discountInput}
                                onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
                                className="flex-1 h-12 px-4 rounded-md border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow placeholder:text-zinc-500"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (discountInput === "WELCOME10") {
                                        applyDiscount("WELCOME10");
                                        setDiscountInput("");
                                    } else {
                                        toast.error("Invalid discount code");
                                    }
                                }}
                                className="h-12 px-6 bg-black text-white text-sm font-medium rounded-md hover:bg-zinc-800 transition-colors"
                            >
                                Apply
                            </button>
                        </div>

                        {discountCode && (
                            <div className="flex items-center justify-between py-2 px-3 bg-zinc-100 rounded-lg text-sm">
                                <div className="flex items-center gap-2 text-zinc-900 font-medium uppercase tracking-wider text-[10px]">
                                    <Tag size={12} className="text-zinc-500" />
                                    {discountCode}
                                </div>
                                <button
                                    onClick={removeDiscount}
                                    className="text-[10px] text-zinc-400 hover:text-red-500 transition-colors uppercase font-bold tracking-tighter"
                                >
                                    Remove
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="h-px w-full bg-zinc-200 my-4" />

                    <div className="space-y-3 text-sm text-zinc-600">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span className="font-medium text-zinc-900">₹{subtotal.toFixed(2)}</span>
                        </div>
                        {discountCode && (
                            <div className="flex justify-between text-blue-600">
                                <span>Discount ({discountCode})</span>
                                <span>-₹{discountAmount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span>Shipping</span>
                            <span className="font-medium text-zinc-900">{shipping === 0 ? "Free" : `₹${shipping.toFixed(2)}`}</span>
                        </div>
                    </div>

                    <div className="h-px w-full bg-zinc-200 my-4" />

                    <div className="flex justify-between items-baseline">
                        <span className="text-base font-medium text-zinc-900">Total</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xs text-zinc-500">INR</span>
                            <span className="text-2xl font-medium text-zinc-900">₹{total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div></div>}>
            <CheckoutContent />
        </Suspense>
    );
}
