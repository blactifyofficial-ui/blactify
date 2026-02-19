/**
 * Maps technical error codes or messages to user-friendly strings.
 * Primary focus is on Firebase Auth and common system/network errors.
 */

export const getFriendlyErrorMessage = (error: unknown): string => {
    if (!error) return "An unexpected error occurred. Please try again.";

    // Handle generic Error objects
    if (error instanceof Error) {
        const message = error.message;

        // Firebase Auth Error Codes (common ones)
        const code = (error as { code?: string }).code || "";

        if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-closure-interaction" ||
            message.includes("auth/popup-closed-by-user") || message.includes("auth/cancelled-closure-interaction")) {
            return "Sign-in was cancelled. Please try again.";
        }

        if (code === "auth/invalid-credential" || message.includes("auth/invalid-credential") ||
            message.includes("auth/wrong-password") || message.includes("auth/user-not-found")) {
            return "Invalid email or password. Please check your credentials and try again.";
        }

        if (code === "auth/email-already-in-use" || message.includes("auth/email-already-in-use")) {
            return "This email is already registered. Please login instead or use a different email.";
        }

        if (code === "auth/weak-password" || message.includes("auth/weak-password")) {
            return "Password is too weak. Please use at least 8 characters with letters and numbers.";
        }

        if (code === "auth/too-many-requests" || message.includes("auth/too-many-requests")) {
            return "Too many failed attempts. Please try again after some time or reset your password.";
        }

        if (code === "auth/network-request-failed" || message.includes("auth/network-request-failed")) {
            return "Network connection issue detected. Please check your internet and try again.";
        }

        // Generic friendly fallbacks for other common phrases
        if (message.toLowerCase().includes("network") || message.toLowerCase().includes("fetch")) {
            return "Connectivity issue. Please check your internet connection.";
        }

        if (message.toLowerCase().includes("stock") || message.toLowerCase().includes("available")) {
            return "Sorry, some items in your bag are no longer available in the requested quantity.";
        }

        return message; // Fallback to the message itself if it doesn't match known patterns
    }

    // Handle string errors
    if (typeof error === "string") {
        if (error.includes("23505")) return "This item already exists."; // Supabase unique constraint
        return error;
    }

    return "Something went wrong. Please try again later.";
};
