"use client";

import { useState } from "react";
import { Loader2, Upload, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface IntakeFormProps {
    projectId: string;
    clientId: string;
}

export default function IntakeForm({ projectId, clientId }: IntakeFormProps) {
    const [formData, setFormData] = useState({
        description: "",
        placement: "",
        size_estimate: "",
        color_preference: "Color", // Default
        medical_notes: "",
    });

    // File handling
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);

    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            // Limit to 5 files total
            if (files.length + newFiles.length > 5) {
                alert("You can only upload up to 5 images.");
                return;
            }

            setFiles(prev => [...prev, ...newFiles]);

            // Create previews
            const newPreviews = newFiles.map(file => URL.createObjectURL(file));
            setPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeFile = (idx: number) => {
        setFiles(prev => prev.filter((_, i) => i !== idx));
        setPreviews(prev => {
            // Revoke old url to avoid memory leak
            URL.revokeObjectURL(prev[idx]);
            return prev.filter((_, i) => i !== idx);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.description || !formData.placement) {
            setErrorMsg("Please fill in the required fields.");
            return;
        }

        setStatus("submitting");
        setErrorMsg("");

        try {
            const data = new FormData();
            data.append("project_id", projectId);
            data.append("client_id", clientId);

            // Append fields
            Object.entries(formData).forEach(([key, value]) => {
                data.append(key, value);
            });

            // Append files
            files.forEach((file) => {
                data.append("reference_images", file);
            });

            const res = await fetch("/api/intake/submit", {
                method: "POST",
                body: data,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to submit");
            }

            setStatus("success");

        } catch (err: any) {
            console.error(err);
            setStatus("error");
            setErrorMsg(err.message || "Something went wrong. Please try again.");
        }
    };

    // --- Success View ---
    if (status === "success") {
        return (
            <Card className="w-full text-center py-10">
                <CardContent className="space-y-4">
                    <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <Check className="h-8 w-8" />
                    </div>
                    <h2 className="text-2xl font-bold">Intake Submitted!</h2>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                        Thank you for providing the details. Your artist has been notified and will review your idea shortly.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>Tattoo Intake Form</CardTitle>
                    <CardDescription>
                        Tell us more about your tattoo idea. Reference images are highly encouraged!
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
                        <textarea
                            id="description"
                            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Describe the subject matter, style, and any specific details..."
                            value={formData.description}
                            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            required
                        />
                    </div>

                    {/* Placement */}
                    <div className="space-y-2">
                        <Label htmlFor="placement">Placement <span className="text-destructive">*</span></Label>
                        <Input
                            id="placement"
                            placeholder="e.g. Left Forearm, Upper Back"
                            value={formData.placement}
                            onChange={e => setFormData(prev => ({ ...prev, placement: e.target.value }))}
                            required
                        />
                    </div>

                    {/* Size & Color */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="size">Size Estimate</Label>
                            <Input
                                id="size"
                                placeholder="e.g. 5x5 inches"
                                value={formData.size_estimate}
                                onChange={e => setFormData(prev => ({ ...prev, size_estimate: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="color">Color Preference</Label>
                            <select
                                id="color"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.color_preference}
                                onChange={e => setFormData(prev => ({ ...prev, color_preference: e.target.value }))}
                            >
                                <option value="Black & Grey">Black & Grey</option>
                                <option value="Color">Color</option>
                                <option value="Both / Not Sure">Both / Not Sure</option>
                            </select>
                        </div>
                    </div>

                    {/* Reference Images */}
                    <div className="space-y-2">
                        <Label>Reference Images (Max 5)</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                            {previews.map((src, i) => (
                                <div key={i} className="relative aspect-square rounded-md overflow-hidden border bg-muted group">
                                    <img src={src} alt="preview" className="object-cover w-full h-full" />
                                    <button
                                        type="button"
                                        onClick={() => removeFile(i)}
                                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}

                            {files.length < 5 && (
                                <label className="flex flex-col items-center justify-center aspect-square rounded-md border-2 border-dashed border-input bg-muted/20 hover:bg-muted/40 cursor-pointer transition">
                                    <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                                    <span className="text-[10px] text-muted-foreground">Upload</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Medical / Other */}
                    <div className="space-y-2">
                        <Label htmlFor="medical">Medical Conditions / Skin Issues (Optional)</Label>
                        <Input
                            id="medical"
                            placeholder="e.g. Allergies, sensitive skin, etc."
                            value={formData.medical_notes}
                            onChange={e => setFormData(prev => ({ ...prev, medical_notes: e.target.value }))}
                        />
                    </div>

                    {/* Error Message */}
                    {errorMsg && (
                        <p className="text-sm text-destructive font-medium">{errorMsg}</p>
                    )}
                </CardContent>

                <CardFooter>
                    <Button type="submit" className="w-full" disabled={status === "submitting"}>
                        {status === "submitting" ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            "Submit Intake Form"
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
