"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { toast } from "sonner";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public static getDerivedStateFromError(_error: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        toast.error("Something went wrong. We've been notified and are looking into it.");
    }

    public render() {
        if (this.state.hasError) {
            return (
                this.props.fallback || (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
                        <h2 className="text-2xl font-bold mb-4">Oops, something went wrong</h2>
                        <p className="text-zinc-500 mb-6 max-w-md">
                            We&apos;ve encountered an unexpected error. Please try refreshing the page or contact support if the issue persists.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-black text-white rounded-full hover:bg-black/90 transition-all"
                        >
                            Refresh Page
                        </button>
                    </div>
                )
            );
        }

        return this.props.children;
    }
}
