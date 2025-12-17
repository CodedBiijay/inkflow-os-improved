"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageSquare, ImageIcon, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ImageViewer } from "@/components/gallery/ImageViewer";

interface GalleryPageProps {
    params: { projectId: string };
}

export default function GalleryPage({ params }: GalleryPageProps) {
    const [project, setProject] = useState<any>(null);
    const [images, setImages] = useState<string[]>([]);
    const [notes, setNotes] = useState<Record<string, string>>({});

    // Viewer State
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerIndex, setViewerIndex] = useState(0);

    useEffect(() => {
        async function fetchProject() {
            const res = await fetch(`/api/projects/details?id=${params.projectId}`);
            if (res.ok) {
                const data = await res.json();
                const p = data.project;
                setProject(p);
                setNotes(p.reference_notes || {});

                // Aggregate images
                // Order: Client images (from intake), Artist images
                const clientImgs = p.intakeForm?.signedImages || [];
                // For artist images, we might need signing if bucket is private. 
                // Currently API just returns paths or URLs. Let's assume URL array for now 
                // but checking `upload-reference` returns "paths".
                // We need to sign artist images too if they are just paths.

                // NOTE: The `details` API route currently only signs intake images. 
                // I should update it to sign artist images too. 
                // For now, I will use placeholders or try to display assuming public if I can't update API yet.
                // Actually I should update the API to be correct. 
                // But for this step I'll assume they are signed or fix the API in next tool call.
                // Let's rely on `p.artist_signed_images` if I update API, or handle it here.

                // Let's fix the API in the next turn. For now, pushing client images.

                setImages(clientImgs);

                if (p.artist_reference_images?.length > 0) {
                    // Temporary: If they are paths not URLs, they won't load.
                    // I will update the API.
                }
            }
        }
        fetchProject();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.projectId]);

    const openViewer = (idx: number) => {
        setViewerIndex(idx);
        setViewerOpen(true);
    };

    if (!project) return <div className="p-10">Loading...</div>;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-lg font-semibold">{project.title}</h1>
                        <p className="text-xs text-muted-foreground">Reference Gallery</p>
                    </div>
                </div>
                <div>
                    <Button variant="default" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Upload
                    </Button>
                </div>
            </header>

            {/* Grid */}
            <main className="p-6">
                {images.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <ImageIcon className="h-10 w-10 mb-4 opacity-50" />
                        <p>No reference images yet.</p>
                    </div>
                ) : (
                    <div className="columns-2 md:columns-3 gap-4 space-y-4">
                        {images.map((src, i) => (
                            <div
                                key={i}
                                className="break-inside-avoid relative group cursor-zoom-in rounded-lg overflow-hidden border bg-muted"
                                onClick={() => openViewer(i)}
                            >
                                <img src={src} className="w-full h-auto block" alt="Ref" />

                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />

                                {notes[src] && (
                                    <div className="absolute bottom-2 right-2 bg-black/60 text-white p-1.5 rounded-full shadow-sm backdrop-blur-sm">
                                        <MessageSquare className="h-3 w-3" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <ImageViewer
                open={viewerOpen}
                onClose={() => setViewerOpen(false)}
                images={images}
                initialIndex={viewerIndex}
                notes={notes}
                projectId={project.id}
                onNoteUpdate={(updated) => setNotes(updated)}
            />
        </div>
    );
}
