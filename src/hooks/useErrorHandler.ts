"use client";

import { useCallback } from "react";
import { toast } from "sonner";

export function useErrorHandler() {
    const handleError = useCallback((_error: unknown, message?: string) => {
        // Log captured internally or by Sentry if integrated
        // Notify user
        toast.error(message || "An unexpected error occurred. Please try again.");
    }, []);

    return { handleError };
}
