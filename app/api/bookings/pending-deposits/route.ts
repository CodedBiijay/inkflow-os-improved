
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
    try {
        const { data: bookings, error } = await supabase
            .from("bookings")
            .select(`
        id,
        start_time,
        deposit_amount,
        status,
        deposit_link,
        clients (name),
        services (name)
      `)
            .eq('status', 'deposit_due')
            .order('start_time');

        // Note: 'deposit_link' is not currently in the schema derived from known instructions.
        // If it were, we'd select it here. For now, we'll return null for the link
        // unless we decide to store it in a metadata column.

        if (error) throw error;

        const formatted = bookings.map((b: any) => ({
            id: b.id,
            start_time: b.start_time,
            deposit_amount: b.deposit_amount,
            client_name: b.clients?.name || "Unknown Client",
            service_name: b.services?.name || "Unknown Service",
            deposit_url: b.deposit_link // Now using real column
        }));

        return NextResponse.json({ bookings: formatted });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
