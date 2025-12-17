
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { booking_id, status } = body;

        if (!booking_id || !status) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const { data: booking, error } = await supabase
            .from("bookings")
            .update({ status })
            .eq("id", booking_id)
            .select()
            .single();

        if (error) throw error;

        // ---- Sync Project Status on Completion ----
        if (status === "completed" && booking.project_id && booking.client_id) {
            // Check if project has *other active* bookings
            const { count } = await supabase
                .from("bookings")
                .select("id", { count: "exact", head: true })
                .eq("project_id", booking.project_id)
                .neq("status", "completed")
                .neq("status", "cancelled")
                .neq("id", booking_id); // Exclude current

            // If no upcoming bookings, mark project as completed
            if (count === 0) {
                await supabase
                    .from("projects")
                    .update({ status: "completed" })
                    .eq("id", booking.project_id);
            }
        }

        return NextResponse.json({ booking });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
