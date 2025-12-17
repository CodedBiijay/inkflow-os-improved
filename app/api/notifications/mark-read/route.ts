
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { notification_id } = body;

        if (!notification_id) {
            return NextResponse.json({ error: "Missing notification_id" }, { status: 400 });
        }

        const { error } = await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("id", notification_id);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
