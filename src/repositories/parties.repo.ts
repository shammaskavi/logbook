import { supabase } from "@/integrations/supabase/client";

export async function fetchParties() {
    const { data, error } = await supabase
        .from("parties")
        .select("*")
        .order("name", { ascending: true });

    if (error) throw error;
    return data;
}

export async function createParty(data: {
    name: string;
    phone_number?: string | null;
    gstin?: string | null;
}) {
    const { data: result, error } = await supabase
        .from("parties")
        .insert({
            name: data.name.trim(),
            phone_number: data.phone_number || null,
            gstin: data.gstin || null,
        })
        .select()
        .single();

    if (error) throw error;

    return result;
}

export async function updateParty(
    id: string,
    data: {
        name: string;
        phone_number?: string | null;
        gstin?: string | null;
    }
) {
    const { data: result, error } = await supabase
        .from("parties")
        .update({
            name: data.name.trim(),
            phone_number: data.phone_number || null,
            gstin: data.gstin || null,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;

    return result;
}

export async function deleteParty(id: string) {
    const { error } = await supabase
        .from("parties")
        .delete()
        .eq("id", id);

    if (error) throw error;
}