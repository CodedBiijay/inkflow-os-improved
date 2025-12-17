
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
    try {
        const { data: clients, error } = await supabase
            .from("clients")
            .select("id, name, email")
            .order("name");

        if (error) throw error;

        return NextResponse.json({ clients });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
