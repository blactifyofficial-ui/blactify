"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import gsap from "gsap";

interface LookHotspotProps {
  category: string;
  top: string; // Percentage e.g. "30%"
  left: string; // Percentage e.g. "50%"
  className?: string;
  label?: string;
}

export function LookHotspot({ category, top, left, className, label }: LookHotspotProps) {
  const router = useRouter();
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ringRef.current) return;

    // Pulse animation for the outer ring
    gsap.to(ringRef.current, {
      scale: 2.5,
      opacity: 0,
      duration: 2,
      repeat: -1,
      ease: "power2.out",
    });

    // Subtle scale animation for the dot
    gsap.to(dotRef.current, {
      scale: 1.2,
      duration: 1,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/shop?category=${encodeURIComponent(category)}`);
  };

  return (
    <div
      className={cn("absolute cursor-pointer group z-10", className)}
      style={{ top, left }}
      onClick={handleClick}
    >
      {/* Hitbox */}
      <div className="absolute -inset-4 z-20" />

      {/* Pulse Rings */}
      <div
        ref={ringRef}
        className="absolute h-4 w-4 rounded-full border border-white/40 bg-black/20"
        style={{ transform: "translate(-50%, -50%)" }}
      />
      
      {/* Inner Dot */}
      <div
        ref={dotRef}
        className="relative h-3 w-3 rounded-full bg-black border border-white/20 shadow-[0_0_8px_rgba(255,255,255,0.2)] flex items-center justify-center"
        style={{ transform: "translate(-50%, -50%)" }}
      >
        <div className="h-1 w-1 rounded-full bg-white/80" />
      </div>

      {/* Hover Label */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none translate-x-2 group-hover:translate-x-0">
        <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-zinc-100 shadow-xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-black whitespace-nowrap">
            {label || category}
          </p>
        </div>
      </div>
    </div>
  );
}
