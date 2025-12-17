
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import dayjs from "dayjs";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const year = searchParams.get("year");
        const month = searchParams.get("month"); // 1-indexed

        if (!year || !month) {
            return NextResponse.json({ error: "Missing year or month" }, { status: 400 });
        }

        // Calculate start and end of month
        const start = dayjs(`${year}-${month}-01`).startOf('month').toISOString();
        const end = dayjs(`${year}-${month}-01`).endOf('month').toISOString();

        const { data: bookings, error } = await supabase
            .from("bookings")
            .select(`
        id,
        start_time,
        title: services (name),
        client: clients (name)
      `)
            .gte('start_time', start)
            .lte('start_time', end);

        if (error) throw error;

        // Group by date
        const grouped: Record<string, any[]> = {};
        bookings?.forEach((b: any) => {
            const date = dayjs(b.start_time).format("YYYY-MM-DD");
            if (!grouped[date]) grouped[date] = [];
            grouped[date].push({
                id: b.id,
                client_name: b.client?.name || "Unknown",
                service_name: b.title?.name || "Unknown",
                start_time: b.start_time,
            });
        });

        const days = Object.keys(grouped).map(date => ({
            date,
            bookings: grouped[date]
        }));

        return NextResponse.json({ days });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
