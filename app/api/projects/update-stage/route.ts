
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { project_id, status } = body;

        if (!project_id || !status) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("projects")
            .update({ status, updated_at: new Date().toISOString() })
            .eq("id", project_id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ project: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
