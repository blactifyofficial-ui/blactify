import { cn } from "@/lib/utils";

export function AdminLoading({ message = "Loading..." }: { message?: string }) {
    return (
        <div className="w-full flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-zinc-100 rounded-full"></div>
                <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <p className="mt-6 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 italic animate-pulse">
                {message}
            </p>
        </div>
    );
}

export function AdminPageHeader({
    title,
    subtitle,
    children
}: {
    title: string;
    subtitle?: string;
    children?: React.ReactNode
}) {
    return (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-heading tracking-tight text-black uppercase">{title}</h1>
                {subtitle && (
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-zinc-500 italic">
                        {subtitle}
                    </p>
                )}
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                {children}
            </div>
        </div>
    );
}

export function AdminCard({
    children,
    className,
    title,
    subtitle,
    icon
}: {
    children: React.ReactNode;
    className?: string;
    title?: string;
    subtitle?: string;
    icon?: React.ReactNode;
}) {
    return (
        <div className={cn("bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm", className)}>
            {(title || subtitle) && (
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        {title && <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900 flex items-center gap-2">
                            {icon}
                            {title}
                        </h3>}
                        {subtitle && <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1 italic">{subtitle}</p>}
                    </div>
                </div>
            )}
            {children}
        </div>
    );
}
