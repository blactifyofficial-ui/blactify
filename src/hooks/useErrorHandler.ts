"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import * as Sentry from "@sentry/nextjs";

export function useErrorHandler() {
    const handleError = useCallback((error: unknown, message?: string) => {
        console.error("Error handled by hook:", error);

        // Log to Sentry
        if (error instanceof Error) {
            Sentry.captureException(error);
        } else {
            Sentry.captureException(new Error(String(error)));
        }

        // Notify user
        toast.error(message || "An unexpected error occurred. Please try again.");
    }, []);

    return { handleError };
}
