
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { client_id, title, status, description, service_id } = body;

        if (!client_id) {
            return NextResponse.json({ error: "Missing client_id" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("projects")
            .insert([{
                client_id,
                title,
                status: status || "intake",
                description,
                service_id
            }])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ project: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
