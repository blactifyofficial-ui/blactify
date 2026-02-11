import Image from "next/image";

interface HeroProps {
    title: string;
    subtitle?: string;
    imageUrl: string;
    ctaText?: string;
    ctaLink?: string;
}

export function Hero({ title, subtitle, imageUrl, ctaText, ctaLink }: HeroProps) {
    return (
        <section className="relative h-[80vh] w-full overflow-hidden bg-zinc-100">
            <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-cover"
                priority
            />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white">
                <h1 className="font-empire text-5xl md:text-7xl mb-4 leading-none">
                    {title}
                </h1>
                {subtitle && (
                    <p className="mb-8 text-lg font-medium tracking-tight opacity-90">
                        {subtitle}
                    </p>
                )}
                {ctaText && ctaLink && (
                    <a
                        href={ctaLink}
                        className="rounded-full bg-white px-8 py-3 text-sm font-bold uppercase tracking-widest text-black transition-transform active:scale-95"
                    >
                        {ctaText}
                    </a>
                )}
            </div>
        </section>
    );
}
