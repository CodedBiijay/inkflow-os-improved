
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const client_id = searchParams.get("client_id");
        const service_id = searchParams.get("service_id");

        if (!client_id) {
            return NextResponse.json({ error: "Missing client_id" }, { status: 400 });
        }

        // Try to find an active project (not completed) for this client
        // If service_id is provided, match that too, otherwise just client
        let query = supabase
            .from("projects")
            .select("*")
            .eq("client_id", client_id)
            .neq("status", "completed");

        if (service_id) {
            query = query.eq("service_id", service_id);
        }

        const { data, error } = await query.limit(1).maybeSingle();

        if (error) throw error;

        return NextResponse.json({ project: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
