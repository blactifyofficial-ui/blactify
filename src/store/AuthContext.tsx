"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";
import { syncUserProfile } from "@/lib/profile-sync";

interface AuthContextType {
    user: User | null;
    isAdmin: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isAdmin: false,
    loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log("Auth State Changed. User:", user?.email);
            setUser(user);

            if (user) {
                try {
                    console.log("Syncing profile for user:", user.uid);
                    const adminStatus = await syncUserProfile(user);
                    console.log("Admin status from sync:", adminStatus);
                    setIsAdmin(adminStatus);
                } catch (err) {
                    console.error("Error in auth sync process:", err);
                    setIsAdmin(false);
                }
            } else {
                console.log("No user session found.");
                setIsAdmin(false);
            }

            setLoading(false);
            console.log("Auth state initialized. Loading: false");
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, isAdmin, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
