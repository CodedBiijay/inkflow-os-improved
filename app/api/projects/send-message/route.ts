import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { project_id, sender_type, message, attachments } = body;

        if (!project_id || !sender_type || !message) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Insert message
        const { data: newMessage, error } = await supabase
            .from("project_messages")
            .insert({
                project_id,
                sender_type,
                message,
                attachments: attachments || []
            })
            .select()
            .single();

        if (error) throw error;

        // If Artist sends a message with attachments, we assume these are design drafts.
        // Add them to project.design_files so they show up in approval screen.
        if (sender_type === 'artist' && attachments && attachments.length > 0) {
            // First fetch current design files to append
            const { data: project } = await supabase.from('projects').select('design_files').eq('id', project_id).single();
            const currentFiles = project?.design_files || [];
            const newFiles = [...currentFiles, ...attachments];

            // Update project
            await supabase.from('projects').update({
                design_files: newFiles,
                // Also, if artist sends new designs, reset approval status or set to specific status?
                // Requirement says: "If attachments uploaded... they go to Supabase storage" - this is handled by frontend upload mostly.
                // We can assume status update might be manual or handled here. Let's set approval to 'pending' if it was rejected?
                // For now, let's just update the files.
                approval_status: 'pending' // Reset to pending effectively asking for approval again
            }).eq('id', project_id);
        } else if (sender_type === 'client') {
            // Fetch project to get artist_id
            const { data: project } = await supabase.from('projects').select('artist_id').eq('id', project_id).single();

            if (project?.artist_id) {
                await supabase.from("notifications").insert({
                    artist_id: project.artist_id,
                    type: "new_message",
                    title: "New Message from Client",
                    body: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
                    entity_type: "project",
                    entity_id: project_id
                });
            }
        }

        return NextResponse.json({ message: newMessage });
    } catch (error) {
        console.error("Error sending message:", error);
        return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }
}
