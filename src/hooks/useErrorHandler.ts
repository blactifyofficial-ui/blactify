"use client";

import { useCallback } from "react";
import { toast } from "sonner";

export function useErrorHandler() {
    const handleError = useCallback((error: unknown, message?: string) => {
        console.error("Error handled by hook:", error);

        // Notify user
        toast.error(message || "An unexpected error occurred. Please try again.");
    }, []);

    return { handleError };
}
