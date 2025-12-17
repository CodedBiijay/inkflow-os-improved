import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { project_id, image_url, note } = body;

        if (!project_id || !image_url) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Fetch current notes
        const { data: project } = await supabase
            .from("projects")
            .select("reference_notes")
            .eq("id", project_id)
            .single();

        const currentNotes = project?.reference_notes || {};

        // Update specific note
        const updatedNotes = {
            ...currentNotes,
            [image_url]: note
        };

        const { error } = await supabase
            .from("projects")
            .update({ reference_notes: updatedNotes })
            .eq("id", project_id);

        if (error) throw error;

        return NextResponse.json({ success: true, notes: updatedNotes });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
