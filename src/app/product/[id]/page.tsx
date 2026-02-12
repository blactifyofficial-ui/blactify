"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useCartStore } from "@/store/useCartStore";
import { ChevronRight, Star, ShoppingBag, ShieldCheck, Truck, RotateCcw, Send, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/store/AuthContext";
import { fetchReviews, postReview } from "@/lib/review-sync";
import { type Product } from "@/components/ui/ProductCard";

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

export default function ProductDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const { addItem } = useCartStore();
    const { user } = useAuth();
    const [selectedSize, setSelectedSize] = useState<string | null>(null);

    // Review states
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        async function fetchProduct() {
            try {
                // Try fetching by ID first, then by handle
                const { data, error } = await supabase
                    .from("products")
                    .select("*, categories(name)")
                    .or(`id.eq.${id},handle.eq.${id}`)
                    .single();

                if (error) throw error;
                setProduct(data);
            } catch (err) {
                console.error("Error fetching product:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchProduct();
    }, [id]);

    const loadReviews = useCallback(async () => {
        if (!product) return;
        const data = await fetchReviews(product.id);
        setReviews(data);
    }, [product]);

    useEffect(() => {
        loadReviews();
    }, [loadReviews]);

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
            await loadReviews();
        } else {
            alert("Failed to post review. Please try again.");
        }
        setIsSubmitting(false);
    };

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

    const sizes = (product?.size_variants && product.size_variants.length > 0) ? product.size_variants : ["S", "M", "L", "XL"];
    const productImages = [
        product.main_image,
        product.image1,
        product.image2,
        product.image3
    ].filter(Boolean) as string[];

    const displayPrice = product.price_offer || product.price_base;
    const hasDiscount = product.price_offer && product.price_offer < product.price_base;

    return (
        <main className="min-h-screen bg-white pb-24 relative">
            {/* Breadcrumbs */}
            <nav className="px-6 py-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                <Link href="/" className="hover:text-black">Home</Link>
                <ChevronRight size={10} />
                <Link href="/shop" className="hover:text-black">Shop</Link>
                <ChevronRight size={10} />
                <span className="text-black">{product.name}</span>
            </nav>

            {/* Images Gallery */}
            <div className="flex flex-col gap-4">
                {productImages.map((img, index) => (
                    <div key={index} className="relative aspect-[4/5] w-full bg-zinc-100 overflow-hidden">
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

            {/* Product Details */}
            <div className="px-6 pt-8">
                <div className="flex flex-col gap-2 mb-6">
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                        {product.categories?.name || product.category || "General"}
                    </span>
                    <h1 className="font-empire text-4xl text-black leading-tight uppercase">{product.name}</h1>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            {hasDiscount ? (
                                <>
                                    <span className="text-2xl font-bold text-black">₹{displayPrice.toFixed(2)}</span>
                                    <span className="text-lg text-zinc-400 line-through">₹{product.price_base.toFixed(2)}</span>
                                </>
                            ) : (
                                <span className="text-2xl font-bold text-black">₹{displayPrice.toFixed(2)}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-1 text-black">
                            <Star size={14} fill="currentColor" />
                            <span className="text-xs font-bold">4.8</span>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">({reviews.length} Reviews)</span>
                        </div>
                    </div>
                </div>

                <p className="text-sm text-zinc-500 font-sans leading-relaxed mb-8">
                    Elevate your everyday rotation with the {product.name}. Crafted from premium materials for unmatched comfort and a modern silhouette that fits any occasion. Features signature branding and refined detailing.
                </p>

                {/* Size Selection */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Select Size</span>
                        <button className="text-[10px] font-bold uppercase tracking-widest text-black underline">Size Guide</button>
                    </div>
                    <div className="flex gap-3">
                        {sizes.map((size: string) => (
                            <button
                                key={size}
                                onClick={() => setSelectedSize(size)}
                                className={`h-14 w-14 rounded-2xl flex items-center justify-center text-xs font-bold transition-all
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

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => addItem(product, selectedSize || undefined)}
                        className="w-full h-16 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-2xl"
                    >
                        <ShoppingBag size={18} />
                        Add to Bag
                    </button>
                    <button
                        onClick={() => {
                            addItem(product, selectedSize || undefined);
                            router.push("/checkout");
                        }}
                        className="w-full h-16 bg-white text-black border border-black rounded-full text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                    >
                        Buy Now
                        <ArrowRight size={18} />
                    </button>
                </div>

                {/* Features */}
                <div className="mt-12 grid grid-cols-1 gap-6 py-8 border-t border-zinc-50">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-zinc-50 rounded-xl text-black">
                            <Truck size={20} />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-black mb-1">Free Delivery</h4>
                            <p className="text-xs text-zinc-400 font-sans">Complimentary shipping on all orders over $99.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-zinc-50 rounded-xl text-black">
                            <RotateCcw size={20} />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-black mb-1">Easy Returns</h4>
                            <p className="text-xs text-zinc-400 font-sans">30-day effortless return policy for your peace of mind.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-zinc-50 rounded-xl text-black">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-black mb-1">Authentic Care</h4>
                            <p className="text-xs text-zinc-400 font-sans">Every piece is verified for premium quality assurance.</p>
                        </div>
                    </div>
                </div>

                {/* Review Section */}
                <section className="mt-12 pt-12 border-t border-zinc-100">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-empire text-3xl">Customer Reviews</h3>
                        <div className="flex items-center gap-1 text-black">
                            <Star size={18} fill="currentColor" />
                            <span className="text-xl font-bold">4.8</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-8">
                        {reviews.length === 0 ? (
                            <p className="text-zinc-500 font-sans italic text-center py-10">No reviews yet. Be the first to share your experience!</p>
                        ) : (
                            reviews.map((review) => (
                                <div key={review.id} className="pb-8 border-b border-zinc-50 last:border-0">
                                    <div className="flex items-center justify-between mb-3">
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
                                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">
                                            {new Date(review.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm font-sans text-zinc-600 leading-relaxed mb-4">
                                        {review.comment}
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <div className="h-6 w-6 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold uppercase">
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
                    <div className="mt-10 p-10 bg-zinc-50 rounded-[40px] text-center">
                        <h4 className="font-empire text-2xl mb-2 text-black">Share Your Thoughts</h4>
                        <p className="text-xs text-zinc-500 font-sans mb-6">Have you purchased this item? We value your feedback.</p>
                        <button
                            onClick={() => setIsReviewModalOpen(true)}
                            className="px-10 py-4 bg-black rounded-full text-[10px] font-bold uppercase tracking-widest text-white shadow-xl active:scale-95 transition-all"
                        >
                            Write a Review
                        </button>
                    </div>
                </section>
            </div>

            {/* Review Modal */}
            {isReviewModalOpen && (
                <>
                    <div
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsReviewModalOpen(false)}
                    />
                    <div className="fixed inset-x-0 bottom-0 z-[110] mx-auto w-full max-w-md bg-white rounded-t-[40px] p-8 shadow-2xl animate-in slide-in-from-bottom duration-500">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-empire text-3xl">Write Review</h3>
                            <button onClick={() => setIsReviewModalOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handlePostReview} className="space-y-8 font-sans">
                            <div className="space-y-4 text-center">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Rating</label>
                                <div className="flex justify-center gap-3">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setNewRating(star)}
                                            className={`transition-all ${newRating >= star ? "text-black scale-110" : "text-zinc-200"}`}
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
                                className="w-full py-5 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? "Posting..." : "Post Review"}
                                <Send size={16} />
                            </button>
                        </form>
                    </div>
                </>
            )}
        </main>
    );
}
