import { supabase } from "@/lib/supabase";
import dayjs from "dayjs";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const artist_id = searchParams.get("artist_id");
    const service_id = searchParams.get("service_id");
    const date = searchParams.get("date");

    if (!artist_id || !service_id || !date) {
        return new Response(JSON.stringify({ error: "Missing params" }), { status: 400 });
    }

    // 1. Get service duration
    const { data: service } = await supabase
        .from("services")
        .select("duration_minutes")
        .eq("id", service_id)
        .single();

    if (!service) {
        return new Response(JSON.stringify({ slots: [] }));
    }

    // 2. Get availability
    const weekday = dayjs(date).day();

    const { data: avail } = await supabase
        .from("availability")
        .select("*")
        .eq("artist_id", artist_id)
        .eq("day_of_week", weekday);

    if (!avail?.length) return new Response(JSON.stringify({ slots: [] }));

    const a = avail[0];

    const slots: any[] = [];

    const start = dayjs(`${date} ${a.start_time}`);
    const end = dayjs(`${date} ${a.end_time}`);

    // 3. Fetch confirmed bookings
    const { data: bookings } = await supabase
        .from("bookings")
        .select("start_time, end_time")
        .eq("artist_id", artist_id)
        .eq("status", "confirmed");

    let cursor = start;

    while (cursor.add(service.duration_minutes, "minute").isBefore(end)) {
        const slotStart = cursor;
        const slotEnd = cursor.add(service.duration_minutes, "minute");

        const conflict = bookings?.some((b) =>
            dayjs(b.start_time).isBefore(slotEnd) &&
            dayjs(b.end_time).isAfter(slotStart)
        );

        if (!conflict) {
            slots.push({
                start: slotStart.toISOString(),
                end: slotEnd.toISOString(),
            });
        }

        cursor = cursor.add(15, "minute");
    }

    return new Response(JSON.stringify({ slots }), { status: 200 });
}
