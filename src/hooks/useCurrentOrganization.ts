

import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface CurrentOrganization {
    organizationId: string;
    organizationName: string;
    organizationSlug: string;
    role: string;
}

export function useCurrentOrganization() {
    const { user, loading: authLoading } = useAuth();

    const query = useQuery({
        queryKey: ["current-organization", user?.id],
        enabled: !authLoading && !!user,
        queryFn: async (): Promise<CurrentOrganization | null> => {
            const { data, error } = await supabase
                .from("organization_members")
                .select(`
          role,
          organization:organizations (
            id,
            name,
            slug
          )
        `)
                .eq("user_id", user!.id)
                .single();

            if (error) {
                // No membership found.
                if (error.code === "PGRST116") {
                    return null;
                }

                throw error;
            }

            const organization = Array.isArray(data.organization)
                ? data.organization[0]
                : data.organization;

            if (!organization) {
                return null;
            }

            return {
                organizationId: organization.id,
                organizationName: organization.name,
                organizationSlug: organization.slug,
                role: data.role,
            };
        },
    });

    return {
        ...query,
        organization: query.data ?? null,
        organizationId: query.data?.organizationId ?? null,
        role: query.data?.role ?? null,
        hasOrganization: !!query.data,
    };
}