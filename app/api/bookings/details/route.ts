
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing booking id" }, { status: 400 });
        }

        const { data: booking, error } = await supabase
            .from("bookings")
            .select(`
        id,
        created_at,
        start_time,
        end_time,
        deposit_amount,
        status,
        deposit_link,
        payment_intent_id,
        client: clients (id, name, email),
        service: services (id, name, duration_minutes)
      `)
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!booking) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        return NextResponse.json({ booking });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
