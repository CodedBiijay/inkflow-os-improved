
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import dayjs from "dayjs";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const startParam = searchParams.get("start"); // YYYY-MM-DD

        if (!startParam) {
            return NextResponse.json({ error: "Missing start date" }, { status: 400 });
        }

        const start = dayjs(startParam).startOf('day').toISOString();
        const end = dayjs(startParam).add(6, 'day').endOf('day').toISOString();

        const { data: bookings, error } = await supabase
            .from("bookings")
            .select(`
        id,
        start_time,
        end_time,
        title: services (name),
        client: clients (name)
      `)
            .gte('start_time', start)
            .lte('start_time', end);

        if (error) throw error;

        const formatted = bookings?.map((b: any) => ({
            id: b.id,
            client_name: b.client?.name || "Unknown",
            service_name: b.title?.name || "Unknown", // "title" alias used in query
            start_time: b.start_time,
            end_time: b.end_time
        })) || [];

        return NextResponse.json({ bookings: formatted });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
