"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle, Maximize2 } from "lucide-react";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";

export default function ApprovalPage() {
    const params = useParams();
    const projectId = params.projectId as string;

    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [showFeedbackInput, setShowFeedbackInput] = useState(false);

    useEffect(() => {
        if (!projectId) return;
        fetchProject();
    }, [projectId]);

    const fetchProject = async () => {
        try {
            const res = await fetch(`/api/projects/details?id=${projectId}`);
            if (res.ok) {
                const data = await res.json();
                setProject(data.project);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (status: 'approved' | 'changes_requested') => {
        setActionLoading(true);
        try {
            // 1. If changes requested, send message first if feedback provided
            if (status === 'changes_requested' && feedback) {
                await fetch("/api/projects/send-message", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        project_id: projectId,
                        sender_type: "client",
                        message: feedback
                    })
                });
            }

            // 2. Sending Approval Update
            const res = await fetch("/api/projects/approve", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    project_id: projectId,
                    approval_status: status
                })
            });

            if (res.ok) {
                fetchProject(); // Refresh
                setShowFeedbackInput(false);
                setFeedback("");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="h-screen w-full flex items-center justify-center bg-zinc-950 text-white"><Loader2 className="animate-spin" /></div>;
    if (!project) return <div className="h-screen w-full flex items-center justify-center bg-zinc-950 text-white">Project not found.</div>;

    const designs = project.design_files || [];

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 font-sans selection:bg-rose-500/30">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="text-center space-y-2 py-8">
                    <h1 className="text-3xl font-bold tracking-tight">Design Approval</h1>
                    <p className="text-zinc-400">Review the latest designs for your project <strong>{project.title}</strong></p>
                </div>

                {/* Status Banner */}
                <div className={`p-4 rounded-lg flex items-center justify-center gap-2 border ${project.approval_status === 'approved' ? 'bg-emerald-950/30 border-emerald-800 text-emerald-400' :
                        project.approval_status === 'changes_requested' ? 'bg-amber-950/30 border-amber-800 text-amber-400' :
                            'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}>
                    {project.approval_status === 'approved' && <CheckCircle className="h-5 w-5" />}
                    {project.approval_status === 'changes_requested' && <AlertCircle className="h-5 w-5" />}
                    <span className="font-medium uppercase tracking-wider text-sm">
                        Status: {project.approval_status?.replace('_', ' ') || 'Pending Review'}
                    </span>
                </div>

                {/* Designs Grid */}
                {designs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {designs.map((url: string, i: number) => (
                            <Card key={i} className="bg-zinc-900 border-zinc-800 overflow-hidden group relative">
                                <div className="aspect-[4/5] bg-zinc-950 relative">
                                    {/* Ideally these should be signed, but if public bucket, plain URL works. ProjectDetails API signs intake, let's assume designs are handled similarly or public for now. If forbidden, we might need a fetch-proxy.
                                    Given we didn't add signing for 'design_files' in details API yet, these might be broken if private. 
                                    Step logic said: "If attachments uploaded...Supabase storage bucket 'designs'".
                                    We will assume standard public access for this MVP step or signed URLs passed if modified.
                                    For now, renders URL directly. */}
                                    <img src={url} alt={`Design ${i + 1}`} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center pointer-events-none">
                                        <a href={url} target="_blank" rel="noopener noreferrer" className="pointer-events-auto bg-white/10 p-3 rounded-full hover:bg-white/20 backdrop-blur-md">
                                            <Maximize2 className="h-6 w-6 text-white" />
                                        </a>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-zinc-900 rounded-lg border border-zinc-800 border-dashed">
                        <p className="text-zinc-400">No designs uploaded yet.</p>
                    </div>
                )}

                {/* Actions */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white">Your Decision</CardTitle>
                        <CardDescription>Please review the designs above and select an option.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {showFeedbackInput ? (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                <Textarea
                                    placeholder="Describe the changes you'd like to see..."
                                    className="bg-zinc-950 border-zinc-700 min-h-[100px]"
                                    value={feedback}
                                    onChange={e => setFeedback(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <Button
                                        variant="default"
                                        className="bg-rose-600 hover:bg-rose-700 text-white"
                                        onClick={() => handleAction('changes_requested')}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Submit Request
                                    </Button>
                                    <Button variant="ghost" onClick={() => setShowFeedbackInput(false)}>Cancel</Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-lg"
                                    onClick={() => handleAction('approved')}
                                    disabled={actionLoading || project.approval_status === 'approved'}
                                >
                                    {project.approval_status === 'approved' ? "Approved" : "Approve Designs"}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800 h-12 text-lg"
                                    onClick={() => setShowFeedbackInput(true)}
                                    disabled={actionLoading}
                                >
                                    Request Changes
                                </Button>
                            </div>
                        )}
                        <p className="text-xs text-center text-zinc-500 pt-2">
                            Approving locks the design for your upcoming session. Requesting changes handles this back to the artist.
                        </p>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
