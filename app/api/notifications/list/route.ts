
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const artist_id = searchParams.get("artist_id");

        if (!artist_id) {
            return NextResponse.json({ error: "Missing artist_id" }, { status: 400 });
        }

        // Fetch notifications
        const { data: notifications, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("artist_id", artist_id)
            .order("created_at", { ascending: false })
            .limit(20);

        if (error) throw error;

        // Fetch unread count
        const { count, error: countError } = await supabase
            .from("notifications")
            .select("*", { count: 'exact', head: true })
            .eq("artist_id", artist_id)
            .eq("is_read", false);

        if (countError) throw countError;

        return NextResponse.json({
            notifications,
            unread_count: count
        });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
