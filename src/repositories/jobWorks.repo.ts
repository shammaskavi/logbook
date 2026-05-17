import { supabase } from "@/integrations/supabase/client";

export async function fetchJobWorks(organizationId: string) {
    const { data, error } = await supabase
        .from("job_work_types")
        .select("*")
        .eq("organization_id", organizationId)
        .order("name", { ascending: true });

    if (error) throw error;
    return data;
}

export async function createJobWork(
    name: string,
    organizationId: string
) {
    const { data: result, error } = await supabase
        .from("job_work_types")
        .insert({
            name: name.trim(),
            active: true,
            organization_id: organizationId,
        })
        .select()
        .single();

    if (error) throw error;
    return result;
}

export async function updateJobWork(
    id: string,
    data: { name: string; active: boolean }
) {
    const { data: result, error } = await supabase
        .from("job_work_types")
        .update({
            name: data.name.trim(),
            active: data.active,
        })
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;
    return result;
}