import { supabase } from "@/integrations/supabase/client";

export async function fetchJobWorks() {
    const { data, error } = await supabase
        .from("job_work_types")
        .select("*")
        .order("name", { ascending: true });

    if (error) throw error;
    return data;
}

export async function createJobWork(data: {
    name: string;
    active?: boolean;
}) {
    const { data: result, error } = await supabase
        .from("job_work_types")
        .insert({
            name: data.name.trim(),
            active: data.active ?? true,
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