"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Save, Edit2 } from "lucide-react";

interface ImageViewerProps {
    open: boolean;
    onClose: () => void;
    images: string[];
    initialIndex: number;
    notes: Record<string, string>;
    projectId: string;
    onNoteUpdate: (updatedNotes: Record<string, string>) => void;
}

export function ImageViewer({
    open,
    onClose,
    images,
    initialIndex,
    notes,
    projectId,
    onNoteUpdate
}: ImageViewerProps) {
    const [index, setIndex] = useState(initialIndex);
    const [currentNote, setCurrentNote] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setIndex(initialIndex);
        }
    }, [open, initialIndex]);

    useEffect(() => {
        const url = images[index];
        setCurrentNote(notes[url] || "");
        setIsEditing(false);
    }, [index, images, notes]);

    const handleNext = () => {
        setIndex((prev) => (prev + 1) % images.length);
    };

    const handlePrev = () => {
        setIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const handleSaveNote = async () => {
        setSaving(true);
        try {
            const url = images[index];
            const res = await fetch("/api/projects/update-reference-note", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    project_id: projectId,
                    image_url: url,
                    note: currentNote
                })
            });

            if (res.ok) {
                onNoteUpdate({ ...notes, [url]: currentNote });
                setIsEditing(false);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-[90vw] h-[90vh] p-0 gap-0 overflow-hidden flex flex-col md:flex-row bg-black/95 border-none text-white">
                <div className="sr-only">
                    <DialogHeader><DialogTitle>Image Viewer</DialogTitle><DialogDescription>Reference Image</DialogDescription></DialogHeader>
                </div>

                {/* Image Area */}
                <div className="relative flex-1 bg-black flex items-center justify-center min-h-[50vh]">
                    <img
                        src={images[index]}
                        className="max-h-full max-w-full object-contain"
                        alt="Reference"
                    />

                    <div className="absolute top-4 right-4 md:hidden">
                        <button onClick={onClose} className="p-2 bg-black/50 rounded-full text-white">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {images.length > 1 && (
                        <>
                            <button onClick={handlePrev} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full hover:bg-white/20 transition">
                                <ChevronLeft className="h-6 w-6" />
                            </button>
                            <button onClick={handleNext} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full hover:bg-white/20 transition">
                                <ChevronRight className="h-6 w-6" />
                            </button>
                        </>
                    )}
                </div>

                {/* Sidebar */}
                <div className="w-full md:w-[320px] bg-zinc-900 border-l border-white/10 flex flex-col">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <h3 className="font-semibold">Details</h3>
                        <button onClick={onClose} className="hidden md:block p-1 hover:bg-white/10 rounded">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="p-4 flex-1 overflow-y-auto">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-zinc-400 uppercase font-bold tracking-wider mb-2 block">
                                    Notes
                                </label>

                                {isEditing ? (
                                    <textarea
                                        className="w-full h-40 bg-zinc-800 border border-zinc-700 rounded-md p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                                        placeholder="Add notes about this reference..."
                                        value={currentNote}
                                        onChange={(e) => setCurrentNote(e.target.value)}
                                    />
                                ) : (
                                    <div
                                        className="min-h-[100px] text-sm text-zinc-300 whitespace-pre-wrap cursor-pointer hover:bg-white/5 p-2 rounded border border-transparent hover:border-white/10 transition"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        {currentNote || <span className="text-zinc-500 italic">No notes. Click to add.</span>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-white/10">
                        {isEditing ? (
                            <div className="flex gap-2">
                                <Button
                                    className="flex-1"
                                    size="sm"
                                    onClick={handleSaveNote}
                                    disabled={saving}
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    Save
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-black bg-white/10 border-white/20 hover:bg-white/20 hover:text-white"
                                    onClick={() => {
                                        setCurrentNote(notes[images[index]] || "");
                                        setIsEditing(false);
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        ) : (
                            <Button
                                variant="secondary"
                                className="w-full"
                                onClick={() => setIsEditing(true)}
                            >
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit Note
                            </Button>
                        )}

                        <div className="mt-4 text-center text-xs text-zinc-500">
                            {index + 1} of {images.length}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
