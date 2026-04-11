"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ShoppingBag,
    User,
    MapPin,
    CreditCard,
    Plus,
    Trash2,
    Search,
    ChevronRight,
    Loader2,
    CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminPageHeader, AdminCard } from "@/components/admin/AdminUI";
import { searchUsers, searchProducts, createManualOrder } from "@/app/actions/admin-orders";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";

interface SearchUser {
    id: string;
    email: string;
    full_name: string | null;
}

interface SearchProduct {
    id: string;
    name: string;
    price_base: number;
    price_offer: number | null;
    product_variants: Array<{
        id: string;
        size: string;
        stock: number;
    }>;
    product_images: Array<{
        url: string;
        position: number;
    }>;
}

interface ProductItem {
    id: string;
    product_id: string;
    variant_id: string;
    name: string;
    size: string;
    price: number;
    quantity: number;
    image?: string;
    stock: number;
}

export default function CreateOrderClient() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [searchingUsers, setSearchingUsers] = useState(false);
    const [searchingProducts, setSearchingProducts] = useState(false);

    // Form State
    const [userQuery, setUserQuery] = useState("");
    const [userResults, setUserResults] = useState<SearchUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);

    const [customerDetails, setCustomerDetails] = useState({
        name: "",
        email: "",
        phone: ""
    });

    const [shippingAddress, setShippingAddress] = useState({
        address: "",
        city: "",
        district: "",
        state: "",
        pincode: "",
        phone: "",
        firstName: "",
        lastName: ""
    });

    const [orderItems, setOrderItems] = useState<ProductItem[]>([]);
    const [productQuery, setProductQuery] = useState("");
    const [productResults, setProductResults] = useState<SearchProduct[]>([]);

    const [payment, setPayment] = useState({
        method: "razorpay",
        id: "",
        status: "paid"
    });

    // Address Parsing helper
    const handleAddressPaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setShippingAddress(prev => ({ ...prev, address: value }));

        // Simple heuristic parsing for Indian addresses
        // This is a "nice to have" but the user specifically asked for "copy paste input"
        // So they might just want one big input, but our DB expects structured data.
        // We'll provide both.
    };

    // Effects
    useEffect(() => {
        if (userQuery.length >= 2) {
            const delayDebounce = setTimeout(async () => {
                setSearchingUsers(true);
                const token = await auth.currentUser?.getIdToken();
                const result = await searchUsers(userQuery, token);
                if (result.success) setUserResults(result.users);
                setSearchingUsers(false);
            }, 500);
            return () => clearTimeout(delayDebounce);
        } else {
            setUserResults([]);
        }
    }, [userQuery]);

    useEffect(() => {
        const fetchInitialProducts = async () => {
            setSearchingProducts(true);
            const token = await auth.currentUser?.getIdToken();
            const result = await searchProducts(productQuery, token);
            if (result.success) setProductResults(result.products);
            setSearchingProducts(false);
        };

        if (productQuery.length >= 2 || productQuery.length === 0) {
            const delayDebounce = setTimeout(fetchInitialProducts, 500);
            return () => clearTimeout(delayDebounce);
        }
    }, [productQuery]);

    // Handlers
    const addProductToOrder = (product: SearchProduct, variant: SearchProduct["product_variants"][0]) => {
        if (variant.stock <= 0) {
            toast.error("Item is out of stock");
            return;
        }

        const existing = orderItems.find(item => item.variant_id === variant.id);
        if (existing) {
            if (existing.quantity >= variant.stock) {
                toast.error(`Only ${variant.stock} units available in stock`);
                return;
            }
            setOrderItems(prev => prev.map(item =>
                item.variant_id === variant.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setOrderItems(prev => [...prev, {
                id: Math.random().toString(),
                product_id: product.id,
                variant_id: variant.id,
                name: product.name,
                size: variant.size,
                // Sort by position to get the main image
                image: product.product_images?.sort((a: { position: number }, b: { position: number }) => a.position - b.position)[0]?.url,
                price: product.price_offer || product.price_base,
                quantity: 1,
                stock: variant.stock
            }]);
        }
        toast.success(`Added ${product.name} (${variant.size})`);
    };

    const removeItem = (id: string) => {
        setOrderItems(prev => prev.filter(item => item.id !== id));
    };

    const updateQuantity = (id: string, delta: number) => {
        setOrderItems(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = item.quantity + delta;
                if (newQty > item.stock) {
                    toast.error(`Only ${item.stock} units available in stock`);
                    return item;
                }
                return { ...item, quantity: Math.max(1, newQty) };
            }
            return item;
        }));
    };

    const selectUser = (user: SearchUser) => {
        setSelectedUser(user);
        setCustomerDetails({
            name: user.full_name || "",
            email: user.email || "",
            phone: ""
        });
        setUserQuery("");
        setUserResults([]);
    };

    const handleSubmit = async () => {
        if (orderItems.length === 0) {
            toast.error("Please add at least one item");
            return;
        }
        if (!customerDetails.email || !customerDetails.name) {
            toast.error("Customer name and email are required");
            return;
        }
        if (!shippingAddress.address || !shippingAddress.pincode) {
            toast.error("Shipping address and pincode are required");
            return;
        }

        setLoading(true);
        try {
            const token = await auth.currentUser?.getIdToken();
            const result = await createManualOrder({
                user_id: selectedUser?.id,
                customer_details: customerDetails,
                shipping_address: {
                    ...shippingAddress,
                    firstName: customerDetails.name.split(' ')[0] || "",
                    lastName: customerDetails.name.split(' ').slice(1).join(' ') || "",
                    phone: customerDetails.phone
                },
                items: orderItems,
                payment: payment
            }, token);

            if (result.success) {
                toast.success("Order created successfully!");
                router.push(`/admin/orders/${result.orderId}`);
            } else {
                toast.error(result.error || "Failed to create order");
            }
        } catch (err: unknown) {
            console.error(err);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal === 0 ? 0 : (subtotal >= 2999 ? 0 : (shippingAddress.state === "Kerala" ? 59 : 79));
    const total = subtotal + shipping;

    return (
        <div className="space-y-10 pb-20 animate-in fade-in duration-700">
            <AdminPageHeader
                title="Create Order"
                subtitle="Manually create a new order for a customer"
            >
                <div className="flex gap-4">
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-3 bg-white border border-zinc-100 rounded-2xl text-xs font-bold uppercase tracking-wide hover:bg-zinc-50 transition-all text-zinc-500 shadow-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-8 py-3 bg-black text-white rounded-2xl text-xs font-bold uppercase tracking-wide hover:bg-zinc-800 transition-all active:scale-[0.98] shadow-xl shadow-black/5 disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading && <Loader2 className="animate-spin" size={14} />}
                        Create Order
                    </button>
                </div>
            </AdminPageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                {/* Left Column: Items & Customer Selection */}
                <div className="lg:col-span-2 space-y-10">

                    {/* Customer Selection */}
                    <AdminCard
                        title="Customer Information"
                        subtitle="Search for an existing user or enter guest details"
                        icon={<User className="text-zinc-400" size={18} />}
                    >
                        <div className="space-y-6">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by email or name..."
                                    value={userQuery}
                                    onChange={(e) => setUserQuery(e.target.value)}
                                    className="pl-12 pr-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl w-full focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-zinc-200 transition-all text-sm font-medium"
                                />
                                {searchingUsers && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <Loader2 className="animate-spin text-zinc-400" size={16} />
                                    </div>
                                )}

                                {userResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-100 rounded-2xl shadow-2xl z-[50] overflow-hidden animate-in slide-in-from-top-2 duration-300">
                                        {userResults.map(user => (
                                            <button
                                                key={user.id}
                                                onClick={() => selectUser(user)}
                                                className="w-full text-left p-4 hover:bg-zinc-50 flex items-center justify-between border-b border-zinc-50 last:border-0 transition-colors"
                                            >
                                                <div>
                                                    <p className="font-bold text-sm text-black">{user.full_name || "No Name"}</p>
                                                    <p className="text-xs text-zinc-400">{user.email}</p>
                                                </div>
                                                <ChevronRight className="text-zinc-300" size={16} />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {selectedUser && (
                                <div className="p-4 bg-black text-white rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center font-bold">
                                            {selectedUser.full_name?.[0] || selectedUser.email?.[0]}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wide">{selectedUser.full_name}</p>
                                            <p className="text-[10px] opacity-60 tracking-wider">{selectedUser.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedUser(null);
                                            setCustomerDetails({ name: "", email: "", phone: "" });
                                        }}
                                        className="text-[10px] uppercase font-bold tracking-wide border border-white/20 px-3 py-1 rounded-lg hover:bg-white/10 transition-colors"
                                    >
                                        Clear
                                    </button>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        placeholder="Customer Name"
                                        value={customerDetails.name}
                                        onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-black/5 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide ml-1">Email Address</label>
                                    <input
                                        type="email"
                                        placeholder="customer@example.com"
                                        value={customerDetails.email}
                                        onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-black/5 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide ml-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        placeholder="9876543210"
                                        value={customerDetails.phone}
                                        onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-black/5 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </AdminCard>

                    {/* Order Items Selection */}
                    <AdminCard
                        title="Order Items"
                        subtitle="Add products and variants to this order"
                        icon={<ShoppingBag className="text-zinc-400" size={18} />}
                    >
                        <div className="space-y-8">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={productQuery}
                                    onChange={(e) => setProductQuery(e.target.value)}
                                    className="pl-12 pr-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl w-full focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-zinc-200 transition-all text-sm font-medium"
                                />
                                {searchingProducts && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <Loader2 className="animate-spin text-zinc-400" size={16} />
                                    </div>
                                )}

                                {productResults.length > 0 && productQuery.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-100 rounded-2xl shadow-2xl z-[40] max-h-[400px] overflow-y-auto">
                                        {productResults.map(product => (
                                            <div key={product.id} className="p-4 border-b border-zinc-50 last:border-0">
                                                <div className="flex justify-between items-center mb-2">
                                                    <p className="font-bold text-sm">{product.name}</p>
                                                    <p className="text-xs font-black">₹{product.price_offer || product.price_base}</p>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {product.product_variants?.map((v: SearchProduct["product_variants"][0]) => {
                                                        const isOutOfStock = v.stock <= 0;
                                                        return (
                                                            <button
                                                                key={v.id}
                                                                onClick={() => addProductToOrder(product, v)}
                                                                disabled={isOutOfStock}
                                                                className={cn(
                                                                    "px-3 py-1.5 border rounded-xl text-[10px] font-bold uppercase transition-all flex items-center gap-2",
                                                                    isOutOfStock
                                                                        ? "bg-zinc-50 text-zinc-300 border-zinc-100 cursor-not-allowed"
                                                                        : "bg-zinc-50 hover:bg-black hover:text-white border-zinc-100"
                                                                )}
                                                            >
                                                                {v.size}
                                                                <span className="opacity-50 font-medium">({v.stock} in stock)</span>
                                                                {!isOutOfStock && <Plus size={10} />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                {orderItems.length > 0 ? (
                                    orderItems.map(item => (
                                        <div key={item.id} className="flex items-center justify-between p-5 bg-white border border-zinc-50 rounded-[2rem] hover:shadow-lg transition-all duration-300">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center font-bold text-xs uppercase">
                                                    {item.size}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-black">{item.name}</p>
                                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide mt-0.5">₹{item.price} • Size {item.size}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-8">
                                                <div className="flex items-center bg-zinc-50 rounded-xl p-1 border border-zinc-100">
                                                    <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-colors text-black font-bold"> - </button>
                                                    <span className="w-10 text-center text-xs font-black">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-colors text-black font-bold"> + </button>
                                                </div>
                                                <div className="text-right w-24">
                                                    <p className="text-sm font-black text-black">₹{(item.price * item.quantity).toLocaleString()}</p>
                                                </div>
                                                <button onClick={() => removeItem(item.id)} className="p-3 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-20 text-center border-2 border-dashed border-zinc-50 rounded-[2.5rem]">
                                        <ShoppingBag className="mx-auto text-zinc-100 mb-4 opacity-50" size={48} />
                                        <p className="text-xs font-black text-zinc-400 uppercase tracking-wide">No items added to order</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </AdminCard>
                </div>

                {/* Right Column: Address & Payment */}
                <div className="space-y-10">

                    {/* Address Information */}
                    <AdminCard
                        title="Shipping Address"
                        subtitle="Enter or paste address details"
                        icon={<MapPin className="text-zinc-400" size={18} />}
                    >
                        <div className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide ml-1">Full Address / Paste</label>
                                <textarea
                                    placeholder="Paste full address here..."
                                    rows={4}
                                    value={shippingAddress.address}
                                    onChange={handleAddressPaste}
                                    className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-black/5 outline-none transition-all resize-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide ml-1">City</label>
                                    <input
                                        type="text"
                                        placeholder="Kochi"
                                        value={shippingAddress.city}
                                        onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                                        className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-black/5 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide ml-1">Pincode</label>
                                    <input
                                        type="text"
                                        placeholder="682001"
                                        value={shippingAddress.pincode}
                                        onChange={(e) => setShippingAddress(prev => ({ ...prev, pincode: e.target.value }))}
                                        className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-black/5 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide ml-1">District</label>
                                    <input
                                        type="text"
                                        placeholder="Ernakulam"
                                        value={shippingAddress.district}
                                        onChange={(e) => setShippingAddress(prev => ({ ...prev, district: e.target.value }))}
                                        className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-black/5 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide ml-1">State</label>
                                    <select
                                        value={shippingAddress.state}
                                        onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
                                        className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-black/5 outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">Select State</option>
                                        <optgroup label="States">
                                            <option value="Andhra Pradesh">Andhra Pradesh</option>
                                            <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                                            <option value="Assam">Assam</option>
                                            <option value="Bihar">Bihar</option>
                                            <option value="Chhattisgarh">Chhattisgarh</option>
                                            <option value="Goa">Goa</option>
                                            <option value="Gujarat">Gujarat</option>
                                            <option value="Haryana">Haryana</option>
                                            <option value="Himachal Pradesh">Himachal Pradesh</option>
                                            <option value="Jharkhand">Jharkhand</option>
                                            <option value="Karnataka">Karnataka</option>
                                            <option value="Kerala">Kerala</option>
                                            <option value="Madhya Pradesh">Madhya Pradesh</option>
                                            <option value="Maharashtra">Maharashtra</option>
                                            <option value="Manipur">Manipur</option>
                                            <option value="Meghalaya">Meghalaya</option>
                                            <option value="Mizoram">Mizoram</option>
                                            <option value="Nagaland">Nagaland</option>
                                            <option value="Odisha">Odisha</option>
                                            <option value="Punjab">Punjab</option>
                                            <option value="Rajasthan">Rajasthan</option>
                                            <option value="Sikkim">Sikkim</option>
                                            <option value="Tamil Nadu">Tamil Nadu</option>
                                            <option value="Telangana">Telangana</option>
                                            <option value="Tripura">Tripura</option>
                                            <option value="Uttar Pradesh">Uttar Pradesh</option>
                                            <option value="Uttarakhand">Uttarakhand</option>
                                            <option value="West Bengal">West Bengal</option>
                                        </optgroup>
                                        <optgroup label="Union Territories">
                                            <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                                            <option value="Chandigarh">Chandigarh</option>
                                            <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
                                            <option value="Delhi">Delhi</option>
                                            <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                                            <option value="Ladakh">Ladakh</option>
                                            <option value="Lakshadweep">Lakshadweep</option>
                                            <option value="Puducherry">Puducherry</option>
                                        </optgroup>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </AdminCard>

                    {/* Payment Information */}
                    <AdminCard
                        title="Payment Details"
                        subtitle="Capture payment source and status"
                        icon={<CreditCard className="text-zinc-400" size={18} />}
                    >
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-5">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide ml-1">Payment Method</label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {['razorpay'].map(method => (
                                            <button
                                                key={method}
                                                onClick={() => setPayment(prev => ({ ...prev, method }))}
                                                className={cn(
                                                    "px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wide border transition-all",
                                                    payment.method === method
                                                        ? "bg-black text-white border-black"
                                                        : "bg-white text-zinc-400 border-zinc-100 hover:border-zinc-300"
                                                )}
                                            >
                                                {method}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide ml-1">Transaction/Payment ID</label>
                                    <input
                                        type="text"
                                        placeholder="pay_xyz or UPI ID"
                                        value={payment.id}
                                        onChange={(e) => setPayment(prev => ({ ...prev, id: e.target.value }))}
                                        className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-black/5 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide ml-1">Order Status</label>
                                    <select
                                        value={payment.status}
                                        onChange={(e) => setPayment(prev => ({ ...prev, status: e.target.value }))}
                                        className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-black/5 outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="unpaid">Unpaid</option>
                                        <option value="paid">Paid</option>
                                        <option value="processing">Processing</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </AdminCard>

                    {/* Order Summary */}
                    <AdminCard title="Order Summary">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-xs font-medium text-zinc-500 uppercase tracking-wide">
                                <span>Subtotal</span>
                                <span>₹{subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-medium text-zinc-500 uppercase tracking-wide">
                                <span>Shipping</span>
                                <span>₹{shipping.toLocaleString()}</span>
                            </div>
                            <div className="pt-4 border-t border-zinc-100 flex justify-between items-center">
                                <span className="text-sm font-black text-black uppercase tracking-wide">Total</span>
                                <span className="text-2xl font-black text-black">₹{total.toLocaleString()}</span>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full mt-6 py-5 bg-black text-white rounded-3xl text-sm font-bold uppercase tracking-wide hover:bg-zinc-800 transition-all active:scale-[0.98] shadow-2xl shadow-black/20 flex items-center justify-center gap-3"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                                {loading ? "Creating..." : "Confirm & Create"}
                            </button>
                        </div>
                    </AdminCard>
                </div>
            </div>
        </div>
    );
}
