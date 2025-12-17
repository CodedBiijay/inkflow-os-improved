
"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

interface ProjectDetailsModalProps {
    projectId: string | null;
    open: boolean;
    onClose: () => void;
    onUpdate?: () => void;
}

export function ProjectDetailsModal({ projectId, open, onClose, onUpdate }: ProjectDetailsModalProps) {
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [activeTab, setActiveTab] = useState("workflow");
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [messagesLoading, setMessagesLoading] = useState(false);

    useEffect(() => {
        if (!open || !projectId) {
            setProject(null);
            return;
        }

        async function fetchDetails() {
            setLoading(true);
            try {
                const res = await fetch(`/api/projects/details?id=${projectId}`);
                if (res.ok) {
                    const data = await res.json();
                    setProject(data.project);
                }
            } catch (error) {
                console.error("Failed to load project details", error);
            } finally {
                setLoading(false);
            }
        }
        fetchDetails();
    }, [open, projectId]);

    useEffect(() => {
        if (!projectId || !open) return;
        if (activeTab === "messages") {
            fetchMessages();
        }
    }, [activeTab, projectId, open]);

    async function fetchMessages() {
        setMessagesLoading(true);
        try {
            const res = await fetch(`/api/projects/messages?projectId=${projectId}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setMessagesLoading(false);
        }
    }

    const sendMessage = async () => {
        if (!newMessage.trim()) return;
        setSending(true);
        try {
            const res = await fetch("/api/projects/send-message", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    project_id: projectId,
                    sender_type: "artist",
                    message: newMessage,
                }), // Attachments not implemented in this modal simple view yet
            });
            if (res.ok) {
                setNewMessage("");
                fetchMessages();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
    };

    const updateStage = async (newStage: string) => {
        setUpdating(true);
        try {
            const res = await fetch("/api/projects/update-stage", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ project_id: project.id, status: newStage }),
            });
            if (res.ok) {
                setProject((prev: any) => ({ ...prev, status: newStage }));
                if (onUpdate) onUpdate();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setUpdating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 border-b">
                    <DialogTitle className="flex items-center justify-between">
                        <span>Project Details</span>
                        {project?.approval_status && (
                            <Badge variant={
                                project.approval_status === 'approved' ? 'default' :
                                    project.approval_status === 'changes_requested' ? 'destructive' : 'outline'
                            }>
                                Approval: {project.approval_status}
                            </Badge>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        Manage project workflow and communication.
                    </DialogDescription>

                    {/* Tabs Header */}
                    <div className="flex gap-4 pt-4 text-sm font-medium text-muted-foreground border-b border-transparent">
                        <button
                            onClick={() => setActiveTab("workflow")}
                            className={`pb-2 border-b-2 transition ${activeTab === "workflow" ? "border-primary text-foreground" : "border-transparent hover:text-foreground"}`}
                        >
                            Workflow
                        </button>
                        <button
                            onClick={() => setActiveTab("messages")}
                            className={`pb-2 border-b-2 transition ${activeTab === "messages" ? "border-primary text-foreground" : "border-transparent hover:text-foreground"}`}
                        >
                            Messages
                        </button>
                    </div>
                </DialogHeader>

                {loading ? (
                    <div className="flex flex-1 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : !project ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                        Project not found.
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto bg-muted/10">
                        {activeTab === "workflow" ? (
                            <div className="p-6 space-y-6">
                                {/* Header Info */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-lg">{project.title}</h3>
                                        <p className="text-sm text-muted-foreground">{project.client?.name}</p>
                                    </div>
                                    <div className="w-[200px]">
                                        <Select
                                            disabled={updating}
                                            value={project.status}
                                            onValueChange={updateStage}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Stage" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="intake">Intake</SelectItem>
                                                <SelectItem value="design">Design</SelectItem>
                                                <SelectItem value="awaiting_approval">Awaiting Approval</SelectItem>
                                                <SelectItem value="approved">Approved</SelectItem>
                                                <SelectItem value="session_scheduled">Session Scheduled</SelectItem>
                                                <SelectItem value="completed">Completed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Info Grid */}
                                <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t">
                                    <div>
                                        <span className="text-xs font-medium text-muted-foreground uppercase">Service</span>
                                        <p className="font-medium">{project.service?.name}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs font-medium text-muted-foreground uppercase">Upcoming Session</span>
                                        <p className="font-medium">
                                            {project.upcomingSession
                                                ? format(new Date(project.upcomingSession.start_time), "MMM d, h:mm a")
                                                : "None scheduled"
                                            }
                                        </p>
                                    </div>
                                </div>

                                {/* Intake & References (Keeping existing UI logic) */}
                                <div className="space-y-2 border-t pt-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-muted-foreground uppercase">Intake Form</span>
                                        <Button
                                            variant="ghost"
                                            size="xs"
                                            className="h-6 text-[10px]"
                                            onClick={() => {
                                                const url = `${window.location.origin}/intake/${project.id}`;
                                                navigator.clipboard.writeText(url);
                                                alert("Intake link copied: " + url);
                                            }}
                                        >
                                            Copy Link
                                        </Button>
                                    </div>
                                    {(project.intakeForm) ? (
                                        <div className="bg-muted/30 p-3 rounded-md text-sm space-y-3">
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div><span className="text-muted-foreground">Placement:</span> {project.intakeForm.placement}</div>
                                                <div><span className="text-muted-foreground">Size:</span> {project.intakeForm.size_estimate || "N/A"}</div>
                                            </div>
                                            <p className="whitespace-pre-wrap text-xs">{project.intakeForm.description}</p>
                                        </div>
                                    ) : <div className="text-xs text-muted-foreground italic">No intake form.</div>}
                                </div>

                                {/* Approval Link Helper */}
                                <div className="border-t pt-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-muted-foreground uppercase">Client Approval</span>
                                        <Button variant="outline" size="xs" onClick={() => {
                                            const url = `${window.location.origin}/approval/${project.id}`;
                                            navigator.clipboard.writeText(url);
                                            alert("Approval link copied: " + url);
                                        }}>
                                            Copy Approval Link
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                {/* Messages List */}
                                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                                    {messagesLoading && messages.length === 0 ? (
                                        <div className="flex justify-center pt-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
                                    ) : messages.length === 0 ? (
                                        <div className="text-center text-muted-foreground text-sm pt-8">No messages yet.</div>
                                    ) : (
                                        messages.map((msg) => (
                                            <div key={msg.id} className={`flex ${msg.sender_type === 'artist' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[80%] rounded-lg p-3 text-sm ${msg.sender_type === 'artist'
                                                    ? 'bg-primary text-primary-foreground rounded-br-none'
                                                    : 'bg-muted rounded-bl-none'
                                                    }`}>
                                                    <p>{msg.message}</p>
                                                    {msg.attachments && msg.attachments.length > 0 && (
                                                        <div className="flex gap-2 mt-2 pt-2 border-t border-primary-foreground/20">
                                                            <span className="text-xs opacity-70 flex items-center gap-1">📎 {msg.attachments.length} attachments</span>
                                                        </div>
                                                    )}
                                                    <div className="text-[10px] opacity-70 mt-1 text-right">
                                                        {format(new Date(msg.created_at), "h:mm a")}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Input Area */}
                                <div className="p-4 bg-background border-t">
                                    <div className="flex gap-2">
                                        <textarea
                                            className="flex-1 min-h-[40px] max-h-[100px] resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder="Type a message..."
                                            value={newMessage}
                                            onChange={e => setNewMessage(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    sendMessage();
                                                }
                                            }}
                                        />
                                        <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                                            {sending ? <Loader2 className="animate-spin" /> : "Send"}
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-2">
                                        * Attachments support coming to this modal soon. Use Gallery for uploads.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'workflow' && (
                    <DialogFooter className="p-6 border-t bg-background">
                        <Button variant="outline" onClick={onClose}>Close</Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
