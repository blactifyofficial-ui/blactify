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
                    await syncUserProfile(user);

                    console.log("Checking is_admin status for user:", user.uid);
                    const { data, error } = await supabase
                        .from("profiles")
                        .select("is_admin")
                        .eq("id", user.uid)
                        .single();

                    if (error) {
                        console.error("Error fetching profile is_admin:", error);
                        setIsAdmin(false);
                    } else if (data) {
                        console.log("Is Admin status:", data.is_admin);
                        setIsAdmin(data.is_admin);
                    } else {
                        console.log("No profile data found for user:", user.uid);
                        setIsAdmin(false);
                    }
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
