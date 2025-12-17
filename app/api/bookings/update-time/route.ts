
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { booking_id, start_time, end_time } = body;

        if (!booking_id || !start_time || !end_time) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Basic availability check could go here, but relying on UI pre-check for now
        // or we could double check overlap if strict

        const { data, error } = await supabase
            .from("bookings")
            .update({ start_time, end_time })
            .eq("id", booking_id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ booking: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
