import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get("projectId");

        if (!projectId) {
            return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
        }

        const { data: messages, error } = await supabase
            .from("project_messages")
            .select("*")
            .eq("project_id", projectId)
            .order("created_at", { ascending: true });

        if (error) throw error;

        // Sign attachment URLs if needed?
        // For simplicity, we assume the stored URLs are either public or we'll sign them on the fly here if they are in 'designs' bucket.
        // Let's sign them just in case.
        const signedMessages = await Promise.all(messages.map(async (msg) => {
            if (msg.attachments && msg.attachments.length > 0) {
                const signedAttachments = [];
                for (const path of msg.attachments) {
                    // Check if path is a full URL or relative path
                    if (!path.startsWith('http')) {
                        const { data } = await supabase.storage.from('designs').createSignedUrl(path, 3600);
                        if (data) signedAttachments.push(data.signedUrl);
                        else signedAttachments.push(path);
                    } else {
                        signedAttachments.push(path);
                    }
                }
                return { ...msg, attachments: signedAttachments };
            }
            return msg;
        }));

        return NextResponse.json({ messages: signedMessages });
    } catch (error) {
        console.error("Error fetching messages:", error);
        return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    }
}
