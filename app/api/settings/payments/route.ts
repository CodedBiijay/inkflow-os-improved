import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { artist_id, default_deposit_amount } = body;

        if (!artist_id) {
            return NextResponse.json({ error: "Missing artist_id" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("artists")
            .update({ default_deposit_amount })
            .eq("id", artist_id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, artist: data });
    } catch (error: any) {
        console.error("Payments Update Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
