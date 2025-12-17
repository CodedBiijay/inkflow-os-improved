
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
    try {
        const { data: artists, error } = await supabase
            .from("artists")
            .select("id, name, studio_name")
            .limit(1);

        if (error) throw error;

        return NextResponse.json({ artists });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
