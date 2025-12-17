
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
    try {
        const { data: services, error } = await supabase
            .from("services")
            .select("*")
            .order("name");

        if (error) throw error;

        return NextResponse.json({ services });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
