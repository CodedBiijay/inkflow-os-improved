
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import dayjs from "dayjs";

export async function GET() {
    try {
        const todayStart = dayjs().startOf('day').toISOString();
        const todayEnd = dayjs().endOf('day').toISOString();

        const { data: bookings, error } = await supabase
            .from("bookings")
            .select(`
        id,
        start_time,
        end_time,
        status,
        clients (name),
        services (name)
      `)
            .gte('start_time', todayStart)
            .lte('start_time', todayEnd)
            .order('start_time');

        if (error) throw error;

        // Flatten the structure for easier frontend consumption
        const formatted = bookings.map((b: any) => ({
            id: b.id,
            start_time: b.start_time,
            end_time: b.end_time,
            status: b.status,
            client_name: b.clients?.name || "Unknown Client",
            service_name: b.services?.name || "Unknown Service",
        }));

        return NextResponse.json({ bookings: formatted });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
