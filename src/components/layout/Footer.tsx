"use client";

import Link from "next/link";

export function Footer() {
    return (
        <footer className="bg-black px-6 pt-4 pb-40 md:pt-8 md:pb-24 border-t border-white/5">
            <div className="mx-auto max-w-7xl">
                <div className="flex flex-col md:flex-row justify-between gap-12 md:gap-24">
                    {/* Left Section: Branding & Copyright */}
                    <div className="space-y-6 flex-1">
                        <Link href="/" className="inline-block group">
                            <span className="text-2xl md:text-3xl font-yapari uppercase tracking-tighter transition-all duration-500 group-hover:opacity-70 text-white">
                                STUDIO
                            </span>
                        </Link>
                        <div className="space-y-4 pt-4">
                            <p className="text-[11px] font-medium leading-relaxed text-zinc-600">
                                ©2025 BLACTIFY. All Rights Reserved.
                            </p>
                            <p className="text-[11px] font-medium leading-relaxed text-zinc-600">
                                Developed by NITHIN NT.
                            </p>
                        </div>
                    </div>
 
                    {/* Right Section: Navigation Columns */}
                    <div className="flex flex-row gap-16 md:gap-32">
                        {/* Connect Column */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-white tracking-tight uppercase">Connect</h3>
                            <ul className="space-y-4 text-xs font-medium text-zinc-500">
                                <li>
                                    <a href="tel:+919207965510" className="hover:text-white transition-colors">
                                        Contact
                                    </a>
                                </li>
                                <li>
                                    <a href="https://instagram.com/blactify" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                                        Instagram
                                    </a>
                                </li>
                                <li>
                                    <a href="https://wa.me/919207965510" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                                        WhatsApp
                                    </a>
                                </li>
                                <li>
                                    <a href="mailto:blactifyofficial@gmail.com?subject=Support%20Request%20-%20STUDIO" className="hover:text-white transition-colors">
                                        Email
                                    </a>
                                </li>
                            </ul>
                        </div>
 
                        {/* Legal info Column */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-white tracking-tight uppercase">Legal info</h3>
                            <ul className="space-y-4 text-xs font-medium text-zinc-500">
                                <li>
                                    <Link href="/policy/privacy" className="hover:text-white transition-colors">
                                        Privacy Policy
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/policy/shipping" className="hover:text-white transition-colors">
                                        Shipping Policy
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/support" className="hover:text-white transition-colors">
                                        Support
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/policy/terms" className="hover:text-white transition-colors">
                                        Terms and Conditions
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
