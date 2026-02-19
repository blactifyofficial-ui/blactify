"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { useCartStore } from "@/store/useCartStore";
import { ChevronRight, ChevronLeft, Star, ShoppingBag, ShieldCheck, Truck, Send, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/store/AuthContext";
import { fetchReviews, postReview } from "@/lib/review-sync";
import { getUserOrders } from "@/lib/order-sync";
import { type Product } from "@/components/ui/ProductCard";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getStoreSettings } from "@/app/actions/settings";
import { getFriendlyErrorMessage } from "@/lib/error-messages";

interface Review {
    id: string;
    product_id: string;
    user_id: string;
    rating: number;
    comment: string;
    created_at: string;
    profiles?: {
        full_name: string;
    };
}

interface ProductClientPageProps {
    initialProduct: Product;
}

export default function ProductClientPage({ initialProduct }: ProductClientPageProps) {
    const router = useRouter();
    const [product] = useState<Product>(initialProduct);
    const [loading] = useState(false);
    const { addItem } = useCartStore();
    const { user } = useAuth();
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Review states
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
    const [storeEnabled, setStoreEnabled] = useState(true);
    const [isCheckingStore, setIsCheckingStore] = useState(true);
    const [hasPurchased, setHasPurchased] = useState(false);
    const [isCheckingPurchase, setIsCheckingPurchase] = useState(false);

    useEffect(() => {
        setIsCheckingStore(true);
        getStoreSettings().then(settings => {
            if (settings) {
                setStoreEnabled(settings.purchases_enabled);
            }
            setIsCheckingStore(false);
        });
    }, []);

    // Minimum swipe distance (in px)
    const minSwipeDistance = 50;

    const productVariants = useMemo(() => product?.product_variants || [], [product]);

    const sizes = useMemo(() => {
        return productVariants.length > 0
            ? productVariants.map(v => v.size)
            : (product?.size_variants && product.size_variants.length > 0 ? product.size_variants : ["S", "M", "L", "XL"]);
    }, [product, productVariants]);

    const isNoSize = useMemo(() =>
        sizes.length === 1 && (sizes[0].toUpperCase() === "NO SIZE" || sizes[0].toLowerCase() === "no size"),
        [sizes]);

    useEffect(() => {
        if (isNoSize && !selectedSize && sizes.length > 0) {
            setSelectedSize(sizes[0]);
        }
    }, [isNoSize, sizes, selectedSize]);

    const loadReviews = useCallback(async () => {
        if (!product) return;
        const data = await fetchReviews(product.id);
        setReviews(data);
    }, [product]);

    useEffect(() => {
        loadReviews();
    }, [loadReviews]);

    useEffect(() => {
        async function checkPurchase() {
            if (!user || !product) {
                setHasPurchased(false);
                return;
            }

            setIsCheckingPurchase(true);
            try {
                const result = await getUserOrders(user.uid);
                if (result.success && result.orders) {
                    // Check if any order contains this product
                    const purchased = result.orders.some((order: { items?: { id: string }[] }) =>
                        order.items?.some((item: { id: string }) => item.id === product.id)
                    );
                    setHasPurchased(purchased);
                }
            } catch (err) {
                console.error("Purchase verification failed:", err);
            } finally {
                setIsCheckingPurchase(false);
            }
        }
        checkPurchase();
    }, [user, product]);

    const handlePostReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            window.dispatchEvent(new CustomEvent('open-auth-modal'));
            return;
        }

        setIsSubmitting(true);
        const result = await postReview({
            product_id: product!.id,
            user_id: user.uid,
            rating: newRating,
            comment: newComment
        });

        if (result.success) {
            setNewComment("");
            setIsReviewModalOpen(false);
            toast.success("Great! Your review has been posted.");
            await loadReviews();
        } else {
            toast.error("Rating Error", { description: getFriendlyErrorMessage(result.error) });
        }
        setIsSubmitting(false);
    };

    const averageRating = useMemo(() => {
        if (reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        return (sum / reviews.length).toFixed(1);
    }, [reviews]);

    const handleDirectBuy = useCallback(() => {
        if (!user) {
            window.dispatchEvent(new CustomEvent("open-auth-modal"));
            return;
        }
        if (!isNoSize && !selectedSize) {
            toast.error("Please select a size first");
            // Scroll to size selection
            const sizeSection = document.querySelector('span[class*="text-zinc-400"]:contains("Select Size")')?.parentElement;
            sizeSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        const directItem = {
            ...product,
            quantity: 1,
            size: selectedSize || undefined,
            cartId: `direct-${product!.id}-${selectedSize || 'no-size'}`
        };

        sessionStorage.setItem("direct-checkout-item", JSON.stringify(directItem));
        router.push("/checkout?direct=true");
    }, [user, product, isNoSize, selectedSize, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen py-20 px-6 text-center">
                <h1 className="font-empire text-3xl mb-4 text-black">Product Not Found</h1>
                <p className="text-zinc-500 mb-8 font-sans">The item you are looking for might have been removed or is temporarily unavailable.</p>
                <Link href="/shop" className="px-8 py-4 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest">
                    Back to Store
                </Link>
            </div>
        );
    }

    const productImages = product.product_images?.length
        ? product.product_images.sort((a, b) => a.position - b.position).map(img => img.url)
        : [product.main_image, product.image1, product.image2, product.image3].filter(Boolean) as string[];

    const displayPrice = product.price_offer || product.price_base;
    const hasDiscount = product.price_offer && product.price_offer < product.price_base;
    const currentStock = productVariants.length > 0
        ? productVariants.reduce((acc: number, v) => acc + v.stock, 0)
        : (product.stock ?? 0);

    return (
        <main className="min-h-screen bg-white text-black pb-24 font-inter">
            <div className="max-w-7xl mx-auto">
                {/* Breadcrumbs */}
                <nav className="px-6 py-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    <Link href="/" className="hover:text-black transition-colors">Home</Link>
                    <ChevronRight size={10} />
                    <Link href="/shop" className="hover:text-black transition-colors">Shop</Link>
                    <ChevronRight size={10} />
                    <span className="text-black truncate">{product.name}</span>
                </nav>

                <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-start lg:px-6">
                    {/* Images Gallery - Single Image Slider */}
                    <div
                        className="relative aspect-[4/5] w-full bg-zinc-50 overflow-hidden group lg:rounded-3xl cursor-grab active:cursor-grabbing"
                        onTouchStart={(e) => {
                            setTouchStart(e.targetTouches[0].clientX);
                            setTouchEnd(null);
                        }}
                        onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
                        onTouchEnd={() => {
                            if (!touchStart || !touchEnd) return;
                            const distance = touchStart - touchEnd;
                            const isLeftSwipe = distance > minSwipeDistance;
                            const isRightSwipe = distance < -minSwipeDistance;

                            if (isLeftSwipe) {
                                setCurrentImageIndex((prev) => (prev < productImages.length - 1 ? prev + 1 : 0));
                            } else if (isRightSwipe) {
                                setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : productImages.length - 1));
                            }

                            setTouchStart(null);
                            setTouchEnd(null);
                        }}
                        onMouseDown={(e) => {
                            setTouchStart(e.clientX);
                            setTouchEnd(null);
                        }}
                        onMouseMove={(e) => {
                            if (touchStart !== null) {
                                setTouchEnd(e.clientX);
                            }
                        }}
                        onMouseUp={() => {
                            if (touchStart === null || touchEnd === null) {
                                setTouchStart(null);
                                setTouchEnd(null);
                                return;
                            }
                            const distance = touchStart - touchEnd;
                            const isLeftSwipe = distance > minSwipeDistance;
                            const isRightSwipe = distance < -minSwipeDistance;

                            if (isLeftSwipe) {
                                setCurrentImageIndex((prev) => (prev < productImages.length - 1 ? prev + 1 : 0));
                            } else if (isRightSwipe) {
                                setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : productImages.length - 1));
                            }

                            setTouchStart(null);
                            setTouchEnd(null);
                        }}
                        onMouseLeave={() => {
                            setTouchStart(null);
                            setTouchEnd(null);
                        }}
                    >
                        <div
                            className="flex h-full transition-transform duration-500 ease-out"
                            style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
                        >
                            {productImages.map((img, index) => (
                                <div key={index} className="relative h-full w-full flex-shrink-0">
                                    <Image
                                        src={img}
                                        alt={`${product.name} - ${index}`}
                                        fill
                                        className="object-cover"
                                        priority={index === 0}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Navigation Arrows */}
                        {productImages.length > 1 && (
                            <>
                                <button
                                    onClick={() => setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : productImages.length - 1))}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    onClick={() => setCurrentImageIndex((prev) => (prev < productImages.length - 1 ? prev + 1 : 0))}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </>
                        )}

                        {/* Pagination Indicators */}
                        {productImages.length > 1 && (
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                                {productImages.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentImageIndex(index)}
                                        className={cn(
                                            "h-1.5 transition-all duration-300 rounded-full",
                                            currentImageIndex === index ? "w-8 bg-black" : "w-1.5 bg-black/20"
                                        )}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Details Section */}
                    <div className="px-6 pt-10 pb-20 lg:pt-0 lg:sticky lg:top-24">
                        <div className="flex flex-col gap-2 mb-8">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                {product.categories?.name || product.category || "General"}
                            </span>
                            <h1 className="text-3xl font-medium text-black leading-tight uppercase">{product.name}</h1>
                            <div className="flex items-center gap-4 mt-1">
                                <div className="flex items-center gap-3">
                                    {hasDiscount ? (
                                        <>
                                            <span className="text-xl font-medium text-black">₹{displayPrice.toLocaleString()}</span>
                                            <span className="text-base text-zinc-300 line-through">₹{product.price_base.toLocaleString()}</span>
                                        </>
                                    ) : (
                                        <span className="text-xl font-medium text-black">₹{displayPrice.toLocaleString()}</span>
                                    )}
                                </div>
                                <div className="h-4 w-[1px] bg-zinc-100" />
                                {reviews.length > 0 ? (
                                    <div className="flex items-center gap-1.5 text-black">
                                        <Star size={14} fill="currentColor" className="text-black" />
                                        <span className="text-[13px] font-bold">{averageRating}</span>
                                        <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest ml-1">({reviews.length})</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 bg-black rounded-full animate-pulse" />
                                        <span className="text-[10px] font-bold text-black uppercase tracking-[0.2em]">New Arrival</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <p className="text-sm text-zinc-500 font-sans leading-relaxed mb-10">
                            Elevate your everyday rotation with the {product.name}. Crafted from premium materials for unmatched comfort and a modern silhouette that fits any occasion. Features signature branding and refined detailing.
                        </p>

                        {/* Size Selection */}
                        {!isNoSize && (
                            <div className="mb-10">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Select Size</span>
                                    {(() => {
                                        const hasMeasurements = productVariants.some(v => v.variant_measurements && v.variant_measurements.length > 0);
                                        return (
                                            <button
                                                disabled={!hasMeasurements}
                                                onClick={() => setIsSizeGuideOpen(true)}
                                                className={cn(
                                                    "text-[10px] font-bold uppercase tracking-widest transition-all relative group",
                                                    hasMeasurements
                                                        ? "text-black hover:text-zinc-600 underline underline-offset-4"
                                                        : "text-zinc-300 cursor-not-allowed opacity-50 capitalize"
                                                )}
                                            >
                                                Size Guide
                                                {!hasMeasurements && (
                                                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-black text-white text-[9px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none uppercase tracking-[0.2em] transform translate-y-1 group-hover:translate-y-0 shadow-xl">
                                                        No Guide Available
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })()}
                                </div>
                                <div className="flex gap-4">
                                    {sizes.map((size: string) => (
                                        <button
                                            key={size}
                                            onClick={() => setSelectedSize(size)}
                                            className={`h-16 w-16 rounded-2xl flex items-center justify-center text-xs font-bold transition-all duration-300
                                                ${selectedSize === size
                                                    ? "bg-black text-white shadow-xl scale-105"
                                                    : "bg-white text-black border border-zinc-100 hover:border-zinc-300"
                                                }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Stock Status */}
                        {currentStock <= 0 && (
                            <div className="mb-6">
                                <div className="flex items-center gap-2 text-red-500 font-bold uppercase tracking-widest text-[10px] bg-red-50 p-3 rounded-xl border border-red-100">
                                    <X size={14} />
                                    Out of Stock
                                </div>
                            </div>
                        )}

                        <div className="relative flex flex-col gap-3 mt-8 lg:mt-0">
                            {isCheckingStore ? (
                                <div className="w-full h-16 rounded-full bg-zinc-50 animate-pulse flex items-center justify-center">
                                    <div className="h-4 w-32 bg-zinc-100 rounded-full" />
                                </div>
                            ) : storeEnabled ? (
                                <>
                                    <button
                                        onClick={async () => {
                                            if (!user) {
                                                window.dispatchEvent(new CustomEvent("open-auth-modal"));
                                                return;
                                            }
                                            if (!isNoSize && !selectedSize) {
                                                toast.error("Please select a size first");
                                                return;
                                            }
                                            await addItem(product!, selectedSize || undefined);
                                        }}
                                        disabled={currentStock <= 0}
                                        className={cn(
                                            "w-full h-16 rounded-full text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3 active:scale-[0.98] transition-all",
                                            currentStock <= 0
                                                ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                                                : "bg-black text-white shadow-2xl shadow-black/10"
                                        )}
                                    >
                                        <ShoppingBag size={18} />
                                        {currentStock <= 0 ? "Unavailable" : "Add to Bag"}
                                    </button>

                                    <button
                                        onClick={handleDirectBuy}
                                        disabled={currentStock <= 0}
                                        className={cn(
                                            "w-full h-16 rounded-full text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3 active:scale-[0.98] transition-all",
                                            currentStock <= 0
                                                ? "hidden"
                                                : "bg-white text-black border border-zinc-200"
                                        )}
                                    >
                                        Buy Now
                                        <ArrowRight size={18} />
                                    </button>
                                </>
                            ) : (
                                <div className="w-full h-16 rounded-full bg-zinc-100 flex flex-col items-center justify-center text-center px-4">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                        <ShieldCheck size={14} />
                                        Store is currently paused
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Features Grid - Inside details for desktop layout if preferred, or outside below */}
                        <div className="mt-16 grid grid-cols-1 gap-8 py-10 border-t border-zinc-50">
                            <div className="flex items-start gap-5">
                                <div className="p-3.5 bg-zinc-50 rounded-2xl text-black">
                                    <Truck size={20} />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-black mb-1">Free Delivery</h4>
                                    <p className="text-xs text-zinc-400 font-sans leading-relaxed">Complimentary shipping on all orders over ₹2,999.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-5">
                                <div className="p-3.5 bg-zinc-50 rounded-2xl text-black">
                                    <X size={20} />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-black mb-1">No Returns</h4>
                                    <p className="text-xs text-zinc-400 font-sans leading-relaxed">This item is non-returnable due to its nature and quality standards.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-5">
                                <div className="p-3.5 bg-zinc-50 rounded-2xl text-black">
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-black mb-1">Authentic Care</h4>
                                    <p className="text-xs text-zinc-400 font-sans leading-relaxed">Every piece is verified for premium quality assurance.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Review Section - Spans full width below grid */}
                <section className="mt-16 pt-16 border-t border-zinc-50 px-6">
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-2xl font-medium text-black uppercase">Customer Reviews</h2>
                        {reviews.length > 0 ? (
                            <div className="flex items-center gap-1.5 text-black">
                                <Star size={18} fill="currentColor" className="text-black" />
                                <span className="text-2xl font-bold">{averageRating}</span>
                            </div>
                        ) : (
                            <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.25em]">No Ratings Yet</span>
                        )}
                    </div>

                    <div className="flex flex-col gap-10">
                        {reviews.length === 0 ? (
                            <div className="py-20 bg-zinc-50 rounded-3xl text-center">
                                <p className="text-zinc-500 font-sans italic">No reviews yet. Be the first to share your experience!</p>
                            </div>
                        ) : (
                            reviews.map((review) => (
                                <div key={review.id} className="pb-10 border-b border-zinc-50 last:border-0">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-1 text-black">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={12}
                                                    fill={i < review.rating ? "currentColor" : "none"}
                                                    className={i < review.rating ? "text-black" : "text-zinc-200"}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-[10px] uppercase font-bold text-zinc-300 tracking-widest">
                                            {new Date(review.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm font-sans text-zinc-600 leading-relaxed mb-6">
                                        {review.comment}
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold uppercase text-zinc-500">
                                            {review.profiles?.full_name?.charAt(0) || "U"}
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-black">
                                            {review.profiles?.full_name || "Verified Buyer"}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Write Review Trigger */}
                    <div className="mt-12 p-10 bg-black rounded-[40px] text-center text-white">
                        <h3 className="text-xl font-medium mb-2 uppercase">Share Your Thoughts</h3>

                        {!user ? (
                            <div className="space-y-6">
                                <p className="text-xs text-zinc-400 font-sans">Please sign in to write a review.</p>
                                <button
                                    onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal'))}
                                    className="px-10 py-4 bg-white text-black rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-white/5 active:scale-95 transition-all"
                                >
                                    Log In / Sign Up
                                </button>
                            </div>
                        ) : isCheckingPurchase ? (
                            <div className="flex flex-col items-center gap-4">
                                <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Verifying Purchase...</p>
                            </div>
                        ) : hasPurchased ? (
                            <div className="space-y-6">
                                <p className="text-xs text-zinc-400 font-sans italic">Verified Buyer. We value your feedback.</p>
                                <button
                                    onClick={() => setIsReviewModalOpen(true)}
                                    className="px-10 py-4 bg-white text-black rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-white/5 active:scale-95 transition-all"
                                >
                                    Write a Review
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 mb-2">
                                    <ShieldCheck size={14} className="text-zinc-500" />
                                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Verified Purchase Only</span>
                                </div>
                                <p className="text-xs text-zinc-400 font-sans max-w-xs mx-auto leading-relaxed">
                                    To maintain the highest standards of authenticity, only shoppers who have experienced this product can leave a review.
                                </p>
                                {isCheckingStore ? (
                                    <div className="flex flex-col items-center gap-2 pt-2">
                                        <div className="h-4 w-24 bg-white/5 animate-pulse rounded-full" />
                                    </div>
                                ) : storeEnabled ? (
                                    <button
                                        onClick={handleDirectBuy}
                                        className="text-[10px] font-bold text-white uppercase tracking-[0.3em] underline underline-offset-[12px] hover:text-zinc-300 transition-all active:scale-95 py-2"
                                    >
                                        Purchase this Item
                                    </button>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 pt-2">
                                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                                            Purchases currently unavailable
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                {/* Review Modal */}
                {isReviewModalOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-[100] bg-black/40 transition-opacity"
                            onClick={() => setIsReviewModalOpen(false)}
                        />
                        <div className="fixed inset-x-0 bottom-0 z-[110] mx-auto w-full max-w-md bg-white rounded-t-[40px] p-10 shadow-2xl animate-in slide-in-from-bottom duration-500">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-medium uppercase text-black">Write Review</h2>
                                <button onClick={() => setIsReviewModalOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handlePostReview} className="space-y-8 font-sans">
                                <div className="space-y-4 text-center">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Rating</label>
                                    <div className="flex justify-center gap-4">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setNewRating(star)}
                                                className={`transition-all duration-300 ${newRating >= star ? "text-black scale-110" : "text-zinc-100"}`}
                                            >
                                                <Star size={32} fill={newRating >= star ? "currentColor" : "none"} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Comment</label>
                                    <textarea
                                        required
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        className="w-full h-32 bg-zinc-50 border-none rounded-3xl p-6 text-sm outline-none focus:ring-2 focus:ring-black transition-all resize-none"
                                        placeholder="Tell us what you think..."
                                    />
                                </div>

                                <button
                                    disabled={isSubmitting}
                                    className="w-full h-16 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-black/10 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? "Posting..." : "Post Review"}
                                    <Send size={16} />
                                </button>
                            </form>
                        </div>
                    </>
                )}

                {/* Size Guide Modal: Smooth Edition */}
                {isSizeGuideOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md animate-in fade-in duration-1000"
                            onClick={() => setIsSizeGuideOpen(false)}
                        />
                        <div
                            className="fixed inset-x-0 bottom-0 z-[110] mx-auto w-full max-w-2xl bg-white rounded-t-[3rem] p-10 sm:p-14 shadow-[0_-40px_100px_rgba(0,0,0,0.2)] flex flex-col max-h-[90vh] border-t border-zinc-100/50 transform transition-all duration-1000 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] animate-in slide-in-from-bottom-full zoom-in-[0.98]"
                        >
                            {/* Decorative Handle */}
                            <div className="w-12 h-1 bg-zinc-100 rounded-full mx-auto mb-10 shrink-0" />

                            <div className="flex items-center justify-between mb-12 flex-shrink-0 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150 fill-mode-both">
                                <div className="space-y-1.5">
                                    <h2 className="text-4xl font-extrabold uppercase tracking-tighter text-black leading-none">Dimensions</h2>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-black rounded-full" />
                                        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-400">Precision Analysis Protocol</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsSizeGuideOpen(false)}
                                    className="w-14 h-14 flex items-center justify-center hover:bg-black hover:text-white rounded-full transition-all duration-500 border border-zinc-100 group"
                                >
                                    <X size={24} className="group-hover:rotate-90 transition-transform duration-500" />
                                </button>
                            </div>

                            <div className="overflow-x-auto pb-8 custom-scrollbar animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-zinc-100">
                                            <th className="py-6 px-4 text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-400">Ref. Size</th>
                                            {/* Extract all measurement types across all variants */}
                                            {Array.from(new Set(
                                                productVariants.flatMap(v =>
                                                    v.variant_measurements?.map(m => m.measurement_types?.name)
                                                ).filter(Boolean)
                                            )).map((name, i) => (
                                                <th key={i} className="py-6 px-4 text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-400 whitespace-nowrap">
                                                    {name}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-50">
                                        {productVariants.sort((a, b) => {
                                            const order: Record<string, number> = { 'XS': 1, 'S': 2, 'M': 3, 'L': 4, 'XL': 5, 'XXL': 6 };
                                            return (order[a.size] || 99) - (order[b.size] || 99);
                                        }).map((variant, idx) => (
                                            <tr
                                                key={variant.id}
                                                className={cn(
                                                    "group hover:bg-zinc-50/80 transition-all duration-500 cursor-default animate-in fade-in slide-in-from-bottom-4 fill-mode-both",
                                                    selectedSize === variant.size && "bg-zinc-50"
                                                )}
                                                style={{ animationDelay: `${400 + (idx * 50)}ms`, animationDuration: '800ms' }}
                                            >
                                                <td className="py-8 px-4">
                                                    <span className="text-base font-black text-black tracking-tight">{variant.size}</span>
                                                </td>
                                                {Array.from(new Set(
                                                    productVariants.flatMap(v =>
                                                        v.variant_measurements?.map(m => m.measurement_types?.name)
                                                    ).filter(Boolean)
                                                )).map((typeName, i) => {
                                                    const m = variant.variant_measurements?.find(vm => vm.measurement_types?.name === typeName);
                                                    return (
                                                        <td key={i} className="py-8 px-4">
                                                            <div className="space-y-1">
                                                                <span className="text-base font-medium text-zinc-600 group-hover:text-black group-hover:font-bold transition-all duration-300">
                                                                    {m?.value || "-"}
                                                                </span>
                                                                <div className="h-0.5 w-0 bg-black group-hover:w-4 transition-all duration-500" />
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <p className="mt-6 text-[10px] font-bold uppercase tracking-widest text-zinc-400 italic text-center">
                                * All measurements are in inches unless otherwise specified.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}
