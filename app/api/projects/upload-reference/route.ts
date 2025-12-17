import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
    try {
        let project_id: string;
        let filesToUpload: { name: string, type: string, content: ArrayBuffer }[] = [];

        const contentType = request.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
            const body = await request.json();
            project_id = body.project_id;
            const rawFiles = body.files || [];

            // Convert Base64/DataURI to Buffer
            filesToUpload = rawFiles.map((f: any) => {
                const matches = f.content.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                if (matches && matches.length === 3) {
                    const buffer = Buffer.from(matches[2], 'base64');
                    return { name: f.name, type: f.type, content: buffer };
                }
                return null;
            }).filter((f: any) => f !== null);

        } else {
            const formData = await request.formData();
            project_id = formData.get("project_id") as string;
            const files = formData.getAll("files") as File[];

            for (const f of files) {
                filesToUpload.push({
                    name: f.name,
                    type: f.type,
                    content: await f.arrayBuffer()
                });
            }
        }

        if (!project_id || filesToUpload.length === 0) {
            return NextResponse.json({ error: "Missing project_id or files" }, { status: 400 });
        }

        const uploadedPaths: string[] = [];

        // Upload files
        for (const file of filesToUpload) {
            const fileExt = file.name.split(".").pop();
            const fileName = `artist_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${project_id}/${fileName}`;
            const buffer = new Uint8Array(file.content);

            const { error: uploadError } = await supabase.storage
                .from("references")
                .upload(filePath, buffer, {
                    contentType: file.type,
                    upsert: false
                });

            if (!uploadError) {
                uploadedPaths.push(filePath);
            }
        }

        // Get current project
        const { data: project } = await supabase
            .from("projects")
            .select("artist_reference_images")
            .eq("id", project_id)
            .single();

        const currentImages = project?.artist_reference_images || [];
        const updatedImages = [...currentImages, ...uploadedPaths];

        // Update project
        const { error: updateError } = await supabase
            .from("projects")
            .update({ artist_reference_images: updatedImages })
            .eq("id", project_id);

        if (updateError) {
            return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
        }

        return NextResponse.json({ success: true, newImages: uploadedPaths, urls: uploadedPaths });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
