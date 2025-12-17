
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { booking_id, notes } = body;

        if (!booking_id) {
            return NextResponse.json({ error: "Missing booking_id" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("bookings")
            .update({ notes })
            .eq("id", booking_id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ booking: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
