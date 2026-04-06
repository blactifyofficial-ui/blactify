"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { MAINTENANCE_CONFIG } from "@/lib/maintenance-config";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface MaintenancePageProps {
  onFinish: () => void;
  endTime?: string | null;
  title?: string;
  message?: string;
}

export default function MaintenancePage({ 
  onFinish, 
  endTime = MAINTENANCE_CONFIG.endTime,
  title = MAINTENANCE_CONFIG.title,
  message = MAINTENANCE_CONFIG.message
}: MaintenancePageProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const triggerReveal = useCallback(() => {
    setIsRevealing(true);
    gsap.to(containerRef.current, {
      yPercent: -100,
      duration: 1.5,
      ease: "expo.inOut",
      onComplete: onFinish
    });
  }, [onFinish]);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const targetTime = endTime || MAINTENANCE_CONFIG.endTime;
      const difference = +new Date(targetTime) - +new Date();
      let res: TimeLeft | null = null;

      if (difference > 0) {
        res = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      } else {
        triggerReveal();
      }

      setTimeLeft(res);
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft(); // Initial call

    return () => clearInterval(timer);
  }, [triggerReveal, endTime]);

  useGSAP(() => {
    const tl = gsap.timeline();

    tl.from(".reveal-overlay", {
        scaleY: 0,
        transformOrigin: "top",
        duration: 1,
        ease: "power4.inOut"
    })
    .from(".m-item", {
      opacity: 0,
      y: 40,
      duration: 1,
      stagger: 0.1,
      ease: "power3.out",
    }, "-=0.5");

    // Noise effect animation
    gsap.to(".noise-bg", {
        opacity: 0.05,
        duration: 0.2,
        repeat: -1,
        yoyo: true,
        ease: "none"
    });
  }, { scope: containerRef });

  if (!timeLeft && !isRevealing) return null;

  return (
    <div ref={containerRef} className="fixed inset-0 z-[10000] flex items-center justify-center bg-black text-white overflow-hidden select-none">
      {/* Visual background layers */}
      <div className="absolute inset-0 bg-black" />
      <div className="absolute inset-0 noise-bg opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url('https://res.cloudinary.com/dytp7vv9g/image/upload/v1691234567/noise_f7z2zm.png')" }} />
      <div className="absolute inset-0 opacity-20 pointer-events-none" 
           style={{ 
             background: "radial-gradient(circle at 50% 50%, #444 0%, #000 100%)",
           }} 
      />
      
      {/* Content wrapper */}
      <div className="relative z-10 w-full max-w-6xl px-6 md:px-12 flex flex-col items-center text-center">
        <div className="m-item mb-12 flex items-center gap-4">
            <span className="w-8 h-[1px] bg-white opacity-40" />
            <span className="text-[10px] md:text-xs tracking-[0.6em] uppercase font-bold text-zinc-400">
                A NEW EXPERIENCE IS COMING
            </span>
            <span className="w-8 h-[1px] bg-white opacity-40" />
        </div>
        
        <h1 className="m-item text-4xl md:text-8xl font-black mb-8 uppercase tracking-tighter leading-none" 
            style={{ fontFamily: "'Druk Wide Bold', 'Space Grotesk', sans-serif" }}>
          {title}
        </h1>
        
        <p className="m-item text-sm md:text-base font-light mb-16 max-w-xl mx-auto opacity-60 leading-relaxed tracking-wider uppercase">
          {message}
        </p>

        {/* Big Countdown Timer */}
        <div className="m-item grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-12 w-full max-w-5xl">
          <TimerUnit label="Days" value={timeLeft ? timeLeft.days : 0} />
          <TimerUnit label="Hours" value={timeLeft ? timeLeft.hours : 0} />
          <TimerUnit label="Minutes" value={timeLeft ? timeLeft.minutes : 0} />
          <TimerUnit label="Seconds" value={timeLeft ? timeLeft.seconds : 0} />
        </div>

        {/* Footer info */}
        <div className="m-item absolute bottom-12 left-0 right-0 py-8">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-[2px] bg-zinc-800" />
                <div className="text-[8px] md:text-[10px] tracking-[0.5em] uppercase text-zinc-500 font-bold">
                    BLACTIFY &copy; {new Date().getFullYear()} / ESTABLISHED FOR TIMELESSNESS
                </div>
            </div>
        </div>
      </div>
      
      {/* Reveal Overlay (initial flash) */}
      <div className="reveal-overlay absolute inset-0 bg-white z-50 pointer-events-none" />
    </div>
  );
}

function TimerUnit({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 md:p-10 bg-zinc-900/60 rounded-2xl border border-white/10 backdrop-blur-2xl shadow-[0_0_50px_-12px_rgba(255,255,255,0.05)] hover:shadow-[0_0_60px_-12px_rgba(255,255,255,0.1)] transition-all duration-700">
      <div className="text-5xl md:text-8xl font-black mb-2 tracking-tighter tabular-nums text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
           style={{ fontFamily: "'Druk Wide Bold', 'Space Grotesk', sans-serif" }}>
        {value.toString().padStart(2, "0")}
      </div>
      <div className="text-[10px] md:text-[12px] tracking-[0.5em] uppercase text-zinc-400 font-black">
        {label}
      </div>
    </div>
  );
}
