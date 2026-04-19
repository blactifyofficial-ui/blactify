"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { useCartStore } from "@/store/useCartStore";
import { ChevronRight, ChevronLeft, Star, ShieldCheck, Truck, Send, X } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/store/AuthContext";
import { fetchReviews, postReview } from "@/lib/review-sync";
import { getUserOrders } from "@/lib/order-sync";
import { type Product } from "@/components/ui/ProductCard";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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
    initialReviews: Review[];
    initialSettings: { purchases_enabled: boolean } | null;
}

export default function ProductClientPage({ initialProduct, initialReviews, initialSettings }: ProductClientPageProps) {
    const router = useRouter();
    const [product] = useState<Product>(initialProduct);
    const [loading] = useState(false);
    const { addItem } = useCartStore();
    const { user } = useAuth();
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Review states
    const [reviews, setReviews] = useState<Review[]>(initialReviews);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const [quantity, setQuantity] = useState(1);
    const storeEnabled = (initialSettings?.purchases_enabled ?? true) || process.env.NODE_ENV === "development";
    const [hasPurchased, setHasPurchased] = useState(false);
    const [isCheckingPurchase, setIsCheckingPurchase] = useState(false);

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
        if (!selectedSize && sizes.length > 0) {
            if (isNoSize) {
                setSelectedSize(sizes[0]);
            } else {
                // Select first available size with stock > 0
                const availableVariant = productVariants.find(v => v.stock > 0);
                if (availableVariant) {
                    setSelectedSize(availableVariant.size);
                }
            }
        }
    }, [isNoSize, sizes, selectedSize, productVariants]);

    const loadReviews = useCallback(async () => {
        if (!product) return;
        const data = await fetchReviews(product.id);
        setReviews(data);
    }, [product]);

    useEffect(() => {
        async function checkPurchase() {
            if (!user || !product) {
                setHasPurchased(false);
                return;
            }

            setIsCheckingPurchase(true);
            try {
                const token = await user.getIdToken();
                const result = await getUserOrders(user.uid, token);
                if (result.success && result.orders) {
                    // Check if any order contains this product
                    const purchased = result.orders.some((order: { items?: { id: string }[] }) =>
                        order.items?.some((item: { id: string }) => item.id === product.id)
                    );
                    setHasPurchased(purchased);
                }
            } catch {
                // silently fail if purchase check fails
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
        try {
            const token = await user.getIdToken();
            const result = await postReview({
                product_id: product!.id,
                user_id: user.uid,
                rating: newRating,
                comment: newComment
            }, token);

            if (result.success) {
                setNewComment("");
                setIsReviewModalOpen(false);
                toast.success("Great! Your review has been posted.");
                await loadReviews();
            } else {
                toast.error("Rating Error", { description: getFriendlyErrorMessage(result.error) });
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Submission failed";
            toast.error("Submission failed", { description: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    };

    const averageRating = useMemo(() => {
        if (reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        return (sum / reviews.length).toFixed(1);
    }, [reviews]);

    const currentStock = product
        ? (product.product_variants && product.product_variants.length > 0
            ? product.product_variants.reduce((acc: number, v) => acc + v.stock, 0)
            : (product.stock ?? 0))
        : 0;

    const activeStock = useMemo(() => {
        if (!product) return 0;
        if (!selectedSize) return currentStock;
        const variants = product.product_variants || [];
        const variant = variants.find(v => v.size === selectedSize);
        return variant ? variant.stock : 0;
    }, [selectedSize, currentStock, product]);

    const minQuantity = useMemo(() => {
        return activeStock > 0 ? 1 : 0;
    }, [activeStock]);

    const maxQuantity = useMemo(() => {
        return Math.min(5, activeStock);
    }, [activeStock]);

    useEffect(() => {
        if (activeStock > 0) {
            if (quantity < minQuantity) {
                setQuantity(minQuantity);
            } else if (quantity > maxQuantity) {
                setQuantity(maxQuantity);
            }
        }
    }, [minQuantity, maxQuantity, activeStock, quantity]);

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
                <p className="text-zinc-500 mb-8">The item you are looking for might have been removed or is temporarily unavailable.</p>
                <Link href="/shop" className="px-8 py-4 bg-black text-white rounded-md text-xs font-bold uppercase tracking-widest">
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


    return (
        <main className="min-h-screen bg-white text-black pb-24 overflow-x-hidden w-full relative">
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
                        className="relative aspect-[4/5] w-full bg-zinc-50 overflow-hidden group lg:rounded-md cursor-grab active:cursor-grabbing touch-action-none"
                        style={{ touchAction: 'pan-y' }}
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
                                        src={img || ""}
                                        alt={`${product.name} - ${index}`}
                                        fill
                                        sizes="(max-width: 1024px) 100vw, 50vw"
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
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    onClick={() => setCurrentImageIndex((prev) => (prev < productImages.length - 1 ? prev + 1 : 0))}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
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
                                            "h-1.5 transition-all duration-300 rounded-sm",
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
                            <h2 className="text-3xl font-medium text-black leading-tight uppercase">{product.name}</h2>
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
                                        <div className="h-1.5 w-1.5 bg-black rounded-sm animate-pulse" />
                                        <span className="text-[10px] font-bold text-black uppercase tracking-[0.2em]">New Arrival</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <p className="text-sm text-zinc-500 leading-relaxed mb-10">
                            Elevate your everyday rotation with the {product.name}. Crafted from premium materials for unmatched comfort and a modern silhouette that fits any occasion. Features signature branding and refined detailing.
                        </p>

                        {/* Size Selection */}
                        {!isNoSize && (
                            <div className="mb-10">
                                <div className="flex items-center justify-between mb-6">
                                    <span className="text-sm font-normal text-black capitalize">
                                        Size: <span className="font-normal">{selectedSize || "-"}</span>
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {sizes.map((size: string) => {
                                        const variant = productVariants.find(v => v.size === size);
                                        const isOutOfStock = variant ? variant.stock <= 0 : false;

                                        return (
                                            <button
                                                key={size}
                                                onClick={() => !isOutOfStock && setSelectedSize(size)}
                                                disabled={isOutOfStock}
                                                className={cn(
                                                    "relative h-12 min-w-[64px] px-4 rounded-sm flex items-center justify-center text-sm font-normal transition-all duration-200 border",
                                                    selectedSize === size
                                                        ? "bg-black text-white border-black"
                                                        : "bg-white text-black border-zinc-200",
                                                    isOutOfStock
                                                        ? "opacity-40 cursor-not-allowed bg-white"
                                                        : "hover:border-black"
                                                )}
                                            >
                                                {size}
                                                {isOutOfStock && (
                                                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                                        <div className="absolute top-0 left-0 w-[150%] h-[1px] bg-zinc-300 origin-top-left rotate-[35deg]" />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Inline Measurements */}
                                {selectedSize && (
                                    <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                                        {(() => {
                                            const selectedVariant = productVariants.find(v => v.size === selectedSize);
                                            const measurements = selectedVariant?.variant_measurements || [];
                                            
                                            if (measurements.length === 0) return null;

                                            return measurements
                                                .sort((a, b) => (Number(a.measurement_types?.id) || 0) - (Number(b.measurement_types?.id) || 0))
                                                .map((m, i) => (
                                                    <div key={i} className="flex items-center gap-1.5">
                                                        <span className="text-sm font-normal text-black">{m.measurement_types?.name}:</span>
                                                        <span className="text-sm font-normal text-black">{m.value}</span>
                                                    </div>
                                                ));
                                        })()}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Stock Status */}
                        {currentStock <= 0 && (
                            <div className="mb-6">
                                <div className="flex items-center gap-2 text-red-500 font-bold uppercase tracking-widest text-[10px] bg-red-50 p-3 rounded-md border border-red-100">
                                    <X size={14} />
                                    Out of Stock
                                </div>
                            </div>
                        )}

                        <div className="relative flex items-center gap-3 mt-8">
                            {storeEnabled ? (
                                <>
                                    {/* Quantity Selector */}
                                    <div className="flex items-center h-12 border border-zinc-200 rounded-sm overflow-hidden bg-white">
                                        <button 
                                            type="button"
                                            onClick={() => setQuantity(prev => Math.max(minQuantity, prev - 1))}
                                            disabled={quantity <= minQuantity}
                                            className="w-10 h-full flex items-center justify-center text-lg font-light hover:bg-zinc-50 transition-colors border-r border-zinc-100 disabled:opacity-20"
                                        >
                                            -
                                        </button>
                                        <div className="w-10 h-full flex items-center justify-center text-sm font-medium">
                                            {quantity}
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => setQuantity(prev => Math.min(maxQuantity, prev + 1))}
                                            disabled={quantity >= maxQuantity}
                                            className="w-10 h-full flex items-center justify-center text-lg font-light hover:bg-zinc-50 transition-colors border-l border-zinc-100 disabled:opacity-20"
                                        >
                                            +
                                        </button>
                                    </div>

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
                                            // Add item with specific quantity
                                            for(let i=0; i<quantity; i++) {
                                                await addItem(product!, selectedSize || undefined);
                                            }
                                            setQuantity(minQuantity);
                                        }}
                                        disabled={activeStock <= 0}
                                        className={cn(
                                            "flex-1 h-12 rounded-sm text-sm font-medium transition-all",
                                            activeStock <= 0
                                                ? "bg-zinc-50 text-zinc-300 border border-zinc-100 cursor-not-allowed"
                                                : "bg-white text-zinc-500 border border-zinc-200 hover:border-zinc-400 active:bg-zinc-50"
                                        )}
                                    >
                                        {activeStock <= 0 ? "Unavailable" : "Add to cart"}
                                    </button>

                                    <button
                                        onClick={handleDirectBuy}
                                        disabled={activeStock <= 0}
                                        className={cn(
                                            "flex-1 h-12 rounded-sm text-sm font-medium transition-all",
                                            activeStock <= 0
                                                ? "hidden"
                                                : "bg-black text-white hover:bg-zinc-900 active:bg-black"
                                        )}
                                    >
                                        Buy now
                                    </button>
                                </>
                            ) : (
                                <div className="w-full h-12 rounded-sm bg-zinc-50 border border-zinc-100 flex items-center justify-center text-center px-4">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                        <ShieldCheck size={14} />
                                        Store is currently paused
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Features Grid - Inside details for desktop layout if preferred, or outside below */}
                        <div className="mt-16 grid grid-cols-1 gap-8 py-10 border-t border-zinc-50">
                            <div className="flex items-start gap-5">
                                <div className="p-3.5 bg-zinc-50 rounded-md text-black">
                                    <Truck size={20} />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-black mb-1">Free Delivery</h4>
                                    <p className="text-xs text-zinc-400 leading-relaxed">Complimentary shipping on all orders over ₹2,999.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-5">
                                <div className="p-3.5 bg-zinc-50 rounded-md text-black">
                                    <X size={20} />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-black mb-1">No Returns</h4>
                                    <p className="text-xs text-zinc-400 leading-relaxed">This item is non-returnable due to its nature and quality standards.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-5">
                                <div className="p-3.5 bg-zinc-50 rounded-md text-black">
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-black mb-1">Authentic Care</h4>
                                    <p className="text-xs text-zinc-400 leading-relaxed">Every piece is verified for premium quality assurance.</p>
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
                            <div className="py-16 bg-white border border-zinc-50 rounded-md text-center">
                                <p className="text-zinc-400 text-sm">No reviews yet. Be the first to share your experience!</p>
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
                                    <p className="text-sm text-zinc-600 leading-relaxed mb-6">
                                        {review.comment}
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <div className="h-4 w-4 rounded-md bg-zinc-100 flex items-center justify-center text-[8px] font-bold uppercase text-zinc-500">
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
                    <div className="mt-12 p-10 bg-black rounded-md text-center text-white">
                        <h3 className="text-xl font-medium mb-2 uppercase">Share Your Thoughts</h3>

                        {!user ? (
                            <div className="space-y-6">
                                <p className="text-xs text-zinc-400">Please sign in to write a review.</p>
                                <button
                                    onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal'))}
                                    className="px-10 py-4 bg-white text-black rounded-md text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-100 active:scale-95 transition-all"
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
                                <p className="text-xs text-zinc-400">Verified Buyer. We value your feedback.</p>
                                <button
                                    onClick={() => setIsReviewModalOpen(true)}
                                    className="px-10 py-4 bg-white text-black rounded-md text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-100 active:scale-95 transition-all"
                                >
                                    Write a Review
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-sm border border-white/10 mb-2">
                                    <ShieldCheck size={14} className="text-zinc-500" />
                                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Verified Purchase Only</span>
                                </div>
                                <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                                    To maintain the highest standards of authenticity, only shoppers who have experienced this product can leave a review.
                                </p>
                                {storeEnabled ? (
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
                        <div className="fixed inset-x-0 bottom-0 z-[110] mx-auto w-full max-w-md bg-white rounded-t-lg p-10 shadow-2xl animate-in slide-in-from-bottom duration-500">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-medium uppercase text-black">Write Review</h2>
                                <button 
                                    onClick={() => setIsReviewModalOpen(false)} 
                                    className="p-1 text-black hover:opacity-50 transition-all active:scale-95"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handlePostReview} className="space-y-8">
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
                                        className="w-full h-32 bg-zinc-50 border-none rounded-md p-6 text-sm outline-none focus:ring-1 focus:ring-black transition-all resize-none"
                                        placeholder="Tell us what you think..."
                                    />
                                </div>

                                <button
                                    disabled={isSubmitting}
                                    className="w-full h-16 bg-black text-white rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-black/10 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? "Posting..." : "Post Review"}
                                    <Send size={16} />
                                </button>
                            </form>
                        </div>
                    </>
                 )}
            </div>
        </main>
    );
}
