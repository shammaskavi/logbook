

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface SignUpParams {
    email: string;
    password: string;
    fullName: string;
    businessName: string;
}

interface AuthContextValue {
    user: User | null;
    session: Session | null;
    loading: boolean;
    isAuthenticated: boolean;

    signIn: (email: string, password: string) => Promise<void>;
    signUp: (params: SignUpParams) => Promise<void>;
    signOut: () => Promise<void>;

    refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function generateSlug(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshSession = useCallback(async () => {
        const {
            data: { session },
            error,
        } = await supabase.auth.getSession();

        if (error) {
            throw error;
        }

        setSession(session);
        setUser(session?.user ?? null);
    }, []);

    useEffect(() => {
        let isMounted = true;

        async function initialize() {
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();

                if (!isMounted) return;

                setSession(session);
                setUser(session?.user ?? null);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        initialize();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signIn = useCallback(async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            throw error;
        }
    }, []);

    const signUp = useCallback(
        async ({ email, password, fullName, businessName }: SignUpParams) => {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            });

            if (error) {
                throw error;
            }

            // Ensure the newly created user has an authenticated session
            // before inserting into RLS-protected tables.
            await signIn(email, password);

            // Fetch the authenticated user from the active session.
            const {
                data: { user: signedInUser },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) {
                throw userError;
            }

            const userId = signedInUser?.id;

            if (!userId) {
                throw new Error("Unable to retrieve the authenticated user.");
            }

            const slug = generateSlug(businessName);

            const { data: organization, error: organizationError } = await supabase
                .from("organizations")
                .insert({
                    name: businessName,
                    slug,
                })
                .select()
                .single();

            if (organizationError) {
                throw organizationError;
            }

            const organizationId = organization.id;

            const { error: membershipError } = await supabase
                .from("organization_members")
                .insert({
                    organization_id: organizationId,
                    user_id: userId,
                    role: "owner",
                });

            if (membershipError) {
                throw membershipError;
            }

            const { error: settingsError } = await supabase
                .from("business_settings")
                .insert({
                    organization_id: organizationId,
                    business_name: businessName,
                });

            if (settingsError) {
                throw settingsError;
            }
        },
        [signIn]
    );

    const signOut = useCallback(async () => {
        const { error } = await supabase.auth.signOut();

        if (error) {
            throw error;
        }
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            session,
            loading,
            isAuthenticated: !!user,
            signIn,
            signUp,
            signOut,
            refreshSession,
        }),
        [user, session, loading, signIn, signUp, signOut, refreshSession]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider.");
    }

    return context;
}