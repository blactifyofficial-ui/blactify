"use client";

import Link from "next/link";

export function Footer() {
    return (
        <footer className="bg-white px-6 py-20 pb-40 md:pb-20 font-sans border-t border-zinc-100">
            <div className="mx-auto max-w-7xl">
                <div className="flex flex-col md:flex-row justify-between gap-12 md:gap-24">
                    {/* Left Section: Branding & Copyright */}
                    <div className="space-y-6 flex-1">
                        <h2 className="font-heading text-5xl md:text-[72px] tracking-[-0.05em] text-black leading-[0.8] uppercase font-bold">BLACTIFY</h2>
                        <div className="space-y-4 pt-4">
                            <p className="text-[11px] font-medium leading-relaxed text-zinc-400">
                                ©2025 Blactify Clothing. All Rights Reserved.
                            </p>
                            <p className="text-[11px] font-medium leading-relaxed text-zinc-400">
                                Developed by NITHIN NT.
                            </p>
                        </div>
                    </div>

                    {/* Right Section: Navigation Columns */}
                    <div className="flex flex-row gap-16 md:gap-32">
                        {/* Connect Column */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-black tracking-tight">Connect</h3>
                            <ul className="space-y-4 text-xs font-medium text-zinc-900">
                                <li>
                                    <Link href="/support" className="hover:text-zinc-500 transition-colors">
                                        Contact
                                    </Link>
                                </li>
                                <li>
                                    <a href="https://instagram.com/blactify" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-500 transition-colors">
                                        Instagram
                                    </a>
                                </li>
                                <li>
                                    <a href="mailto:blactifyofficial@gmail.com" className="hover:text-zinc-500 transition-colors">
                                        Email
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Legal info Column */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-black tracking-tight">Legal info</h3>
                            <ul className="space-y-4 text-xs font-medium text-zinc-900">
                                <li>
                                    <Link href="/policy/privacy" className="hover:text-zinc-500 transition-colors">
                                        Privacy Policy
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/policy/shipping" className="hover:text-zinc-500 transition-colors">
                                        Shipping Policy
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/support" className="hover:text-zinc-500 transition-colors">
                                        Support
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/policy/terms" className="hover:text-zinc-500 transition-colors">
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
