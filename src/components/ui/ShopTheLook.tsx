"use client";

import Image from "next/image";
import { LookHotspot } from "./LookHotspot";
import { cn } from "@/lib/utils";

interface Hotspot {
  category: string;
  top: string;
  left: string;
  label?: string;
}

interface ShopTheLookProps {
  src: string;
  alt: string;
  hotspots: Hotspot[];
  className?: string;
}

export function ShopTheLook({ src, alt, hotspots, className }: ShopTheLookProps) {
  return (
    <div className={cn("relative w-full overflow-hidden group/look", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-contain transition-transform duration-1000 group-hover/look:scale-105"
        sizes="(max-width: 768px) 100vw, 80vw"
        priority
        unoptimized
      />
      
      {hotspots.map((spot, index) => (
        <LookHotspot
          key={index}
          category={spot.category}
          top={spot.top}
          left={spot.left}
          label={spot.label}
        />
      ))}
    </div>
  );
}
