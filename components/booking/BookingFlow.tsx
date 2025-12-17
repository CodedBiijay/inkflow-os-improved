"use client";

import * as React from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarIcon, Loader2, ArrowLeft, ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

// ---- Types ---- //

type BookingStep = "client" | "service" | "project" | "datetime" | "review" | "done";

type BookingStatus =
    | "idle"
    | "creating_booking"
    | "creating_payment_link"
    | "success"
    | "error";

interface Client {
    id: string;
    name: string;
    email: string;
    isTemp?: boolean;
}

interface Service {
    id: string;
    name: string;
    durationMinutes: number;
    depositAmount: number;
}

interface Slot {
    start: string; // ISO
    end: string;   // ISO
}

interface BookingContext {
    client?: Client;
    service?: Service;
    projectTitle?: string;
    projectDescription?: string;
    projectId?: string; // Add this field
    date?: string;   // YYYY-MM-DD
    slot?: Slot;
    bookingId?: string;
    depositUrl?: string;
    status: BookingStatus;
    error?: string;
}

// ---- Helpers ---- //

async function fetchServices(): Promise<Service[]> {
    const res = await fetch("/api/services/list");
    if (!res.ok) throw new Error("Failed to fetch services");
    const data = await res.json();
    return data.services || [];
}

async function fetchClients(): Promise<Client[]> {
    const res = await fetch("/api/clients/list");
    if (!res.ok) throw new Error("Failed to fetch clients");
    const data = await res.json();
    return data.clients || [];
}

async function fetchSlotsForDate(date: string, serviceId: string, artistId: string): Promise<Slot[]> {
    const res = await fetch(`/api/availability?date=${date}&service_id=${serviceId}&artist_id=${artistId}`);
    if (!res.ok) return []; // Handle error gracefully or throw
    const data = await res.json();
    return data.slots || [];
}

async function createClientApi(name: string, email: string) {
    const res = await fetch("/api/clients", {
        method: "POST",
        body: JSON.stringify({ name, email }),
        headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to create client");
    return res.json();
}

// ---- State Machine Logic ---- //

const stepOrder: BookingStep[] = ["client", "service", "project", "datetime", "review", "done"];

function getNextStep(current: BookingStep): BookingStep {
    const idx = stepOrder.indexOf(current);
    return stepOrder[Math.min(idx + 1, stepOrder.length - 1)];
}

function getPrevStep(current: BookingStep): BookingStep {
    const idx = stepOrder.indexOf(current);
    return stepOrder[Math.max(idx - 1, 0)];
}

function canAdvance(step: BookingStep, ctx: BookingContext): boolean {
    switch (step) {
        case "client":
            return !!ctx.client;
        case "service":
            return !!ctx.service;
        case "project":
            return !!ctx.projectTitle;
        case "datetime":
            return !!ctx.date && !!ctx.slot;
        case "review":
            return true;
        default:
            return false;
    }
}

// ---- Components ---- //

function MotionStep({ children, ...props }: React.ComponentProps<typeof motion.div>) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            {...props}
        >
            {children}
        </motion.div>
    );
}

const stepLabels: Record<BookingStep, string> = {
    client: "Client",
    service: "Service",
    project: "Project",
    datetime: "Date & Time",
    review: "Review",
    done: "Done",
};

function StepIndicator({ current }: { current: BookingStep }) {
    return (
        <ol className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            {stepOrder.map((step, idx) => {
                const active = step === current;
                const completed = stepOrder.indexOf(current) > idx;
                return (
                    <li key={step} className="flex items-center gap-2">
                        <span
                            className={[
                                "flex h-6 w-6 items-center justify-center rounded-full border text-[11px]",
                                active
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : completed
                                        ? "border-emerald-500 bg-emerald-500 text-emerald-50"
                                        : "border-border bg-muted",
                            ].join(" ")}
                        >
                            {completed ? <Check className="h-3 w-3" /> : idx + 1}
                        </span>
                        <span
                            className={
                                active || completed ? "font-medium text-foreground" : ""
                            }
                        >
                            {stepLabels[step]}
                        </span>
                        {idx < stepOrder.length - 1 && (
                            <span className="h-px w-6 bg-border" />
                        )}
                    </li>
                );
            })}
        </ol>
    );
}

// ---- Main BookingFlow Component ---- //

export default function BookingFlow() {
    const [step, setStep] = React.useState<BookingStep>("client");
    const [ctx, setCtx] = React.useState<BookingContext>({ status: "idle" });

    // Data
    const [services, setServices] = React.useState<Service[]>([]);
    const [clients, setClients] = React.useState<Client[]>([]);
    const [slots, setSlots] = React.useState<Slot[]>([]);
    const [artistId, setArtistId] = React.useState<string | null>(null);
    const [loadingData, setLoadingData] = React.useState(true);
    const [loadingSlots, setLoadingSlots] = React.useState(false);

    // Initial Fetch
    React.useEffect(() => {
        Promise.all([
            fetchServices(),
            fetchClients(),
            fetch("/api/artists/list").then(res => res.json())
        ])
            .then(([s, c, aData]) => {
                setServices(s);
                setClients(c);
                if (aData.artists && aData.artists.length > 0) {
                    setArtistId(aData.artists[0].id);
                }
            })
            .catch((err) => console.error(err))
            .finally(() => setLoadingData(false));
    }, []);

    // Fetch slots when date/service changes
    React.useEffect(() => {
        if (ctx.date && ctx.service && artistId) {
            setLoadingSlots(true);
            fetchSlotsForDate(ctx.date, ctx.service.id, artistId)
                .then((s) => setSlots(s))
                .catch(() => setSlots([]))
                .finally(() => setLoadingSlots(false));
        } else {
            setSlots([]);
        }
    }, [ctx.date, ctx.service, artistId]);

    const goNext = async () => {
        if (!canAdvance(step, ctx)) return;

        if (step === "review") {
            // SUBMIT LOGIC
            setCtx((prev) => ({ ...prev, status: "creating_booking" }));
            try {
                // 1. Ensure Client
                let finalClientId = ctx.client!.id;
                if (ctx.client!.isTemp) {
                    const newClient = await createClientApi(ctx.client!.name, ctx.client!.email);
                    finalClientId = newClient.id;
                }

                const selectedService = ctx.service!;

                // 2. Create Project OR Use Existing
                let projectId = ctx.projectId;

                if (!projectId) {
                    // Create new project
                    const resNewProject = await fetch("/api/projects/create", {
                        method: "POST",
                        body: JSON.stringify({
                            client_id: finalClientId,
                            title: ctx.projectTitle,
                            status: "intake",
                            description: ctx.projectDescription,
                            service_id: selectedService.id
                        }),
                        headers: { "Content-Type": "application/json" },
                    });

                    if (resNewProject.ok) {
                        const pData = await resNewProject.json();
                        projectId = pData.id;
                    } else {
                        console.error("Failed to create project");
                    }
                }

                // 3. Create Booking
                const resBooking = await fetch("/api/bookings/create", {
                    method: "POST",
                    body: JSON.stringify({
                        artist_id: artistId, // Fixed: Added artist_id
                        client_id: finalClientId,
                        service_id: selectedService.id,
                        project_id: projectId,
                        start_time: ctx.slot!.start,
                        end_time: ctx.slot!.end,
                        deposit_amount: selectedService.depositAmount, // Fixed: Added deposit amount
                    }),
                    headers: { "Content-Type": "application/json" },
                });

                if (!resBooking.ok) {
                    const errData = await resBooking.json().catch(() => ({}));
                    console.error("Booking API Error:", errData);
                    throw new Error(errData.error || `Failed to create booking (${resBooking.status})`);
                }
                const bookingData = await resBooking.json();

                // 4. Create Stripe Link
                setCtx((prev) => ({ ...prev, status: "creating_payment_link" }));
                const resLink = await fetch("/api/stripe/create-payment-link", {
                    method: "POST",
                    body: JSON.stringify({
                        bookingId: bookingData.id,
                        amount: selectedService.depositAmount,
                        serviceName: selectedService.name,
                    }),
                    headers: { "Content-Type": "application/json" },
                });

                if (!resLink.ok) throw new Error("Failed to create deposit link");
                const { url } = await resLink.json();

                setCtx((prev) => ({
                    ...prev,
                    status: "success",
                    depositUrl: url,
                    bookingId: bookingData.id,
                }));
                setStep("done");

            } catch (err) {
                console.error(err);
                setCtx((prev) => ({ ...prev, status: "error", error: "Something went wrong." }));
            }
            return;
        }

        setStep(getNextStep(step));
    };

    const goBack = () => {
        setStep(getPrevStep(step));
    };

    const onReset = () => {
        setStep("client");
        setCtx({ status: "idle" });
        // Keeping clients/services loaded
    };

    return (
        <Card className="w-full max-w-2xl mx-auto shadow-lg border-border/60">
            <CardHeader className="pb-4 border-b bg-muted/20">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>New Booking</CardTitle>
                        <CardDescription>Schedule a new session</CardDescription>
                    </div>
                    {step === "done" && (
                        <div className="rounded-full bg-emerald-100 p-2 text-emerald-600">
                            <Check className="h-4 w-4" />
                        </div>
                    )}
                </div>
                {step !== "done" && <StepIndicator current={step} />}
            </CardHeader>

            <CardContent className="pt-6 min-h-[400px]">
                <AnimatePresence mode="wait">
                    {step === "client" && (
                        <MotionStep key="client">
                            <ClientStep
                                ctx={ctx}
                                clients={clients}
                                loading={loadingData}
                                onSelectClient={(client) => setCtx((prev) => ({ ...prev, client }))}
                            />
                        </MotionStep>
                    )}

                    {step === "service" && (
                        <MotionStep key="service">
                            <ServiceStep
                                ctx={ctx}
                                services={services}
                                loading={loadingData}
                                onSelectService={(service) =>
                                    setCtx((prev) => ({
                                        ...prev,
                                        service,
                                        projectTitle: prev.projectTitle || `${service.name} Project` // Auto-fill
                                    }))
                                }
                            />
                        </MotionStep>
                    )}

                    {step === "project" && (
                        <MotionStep key="project">
                            <ProjectStep
                                ctx={ctx}
                                onChangeTitle={(title) => setCtx((prev) => ({ ...prev, projectTitle: title }))}
                                onChangeDescription={(desc) => setCtx((prev) => ({ ...prev, projectDescription: desc }))}
                                onSelectProject={(id) => setCtx((prev) => ({ ...prev, projectId: id }))}
                            />
                        </MotionStep>
                    )}

                    {step === "datetime" && (
                        <MotionStep key="datetime">
                            <DateTimeStep
                                ctx={ctx}
                                slots={slots}
                                loadingSlots={loadingSlots}
                                onChangeDate={(date) => setCtx((prev) => ({ ...prev, date, slot: undefined }))}
                                onSelectSlot={(slot) => setCtx((prev) => ({ ...prev, slot }))}
                            />
                        </MotionStep>
                    )}

                    {step === "review" && (
                        <MotionStep key="review">
                            <ReviewStep ctx={ctx} />
                        </MotionStep>
                    )}

                    {step === "done" && (
                        <MotionStep key="done">
                            <DoneStep ctx={ctx} onReset={onReset} />
                        </MotionStep>
                    )}
                </AnimatePresence>

                {ctx.status === "error" && (
                    <p className="mt-4 text-sm text-destructive font-medium">{ctx.error}</p>
                )}
            </CardContent>

            <CardFooter className="border-t bg-muted/20 py-4 flex justify-between">
                {step !== "done" && (
                    <>
                        <Button
                            variant="ghost"
                            onClick={goBack}
                            disabled={step === "client" || ctx.status.startsWith("creating")}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>

                        <Button
                            onClick={goNext}
                            disabled={!canAdvance(step, ctx) || ctx.status.startsWith("creating")}
                        >
                            {ctx.status.startsWith("creating") && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {step === "review" ? "Confirm Booking" : "Next"}
                            {step !== "review" && !ctx.status.startsWith("creating") && (
                                <ArrowRight className="ml-2 h-4 w-4" />
                            )}
                        </Button>
                    </>
                )}
            </CardFooter>
        </Card>
    );
}

// ---- Sub Components ---- //

function ClientStep({
    ctx,
    clients,
    loading,
    onSelectClient,
}: {
    ctx: BookingContext;
    clients: Client[];
    loading: boolean;
    onSelectClient: (c: Client) => void;
}) {
    const [mode, setMode] = React.useState<"existing" | "new">("existing");
    const [newName, setNewName] = React.useState("");
    const [newEmail, setNewEmail] = React.useState("");

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-base">Select client</h3>
            <div className="flex gap-2 text-xs">
                <Button
                    variant={mode === "existing" ? "default" : "outline"}
                    size="xs"
                    onClick={() => setMode("existing")}
                >
                    Existing
                </Button>
                <Button
                    variant={mode === "new" ? "default" : "outline"}
                    size="xs"
                    onClick={() => setMode("new")}
                >
                    New
                </Button>
            </div>

            {mode === "existing" && (
                <div className="space-y-2">
                    <Label className="text-xs">Choose from clients</Label>
                    <Select
                        value={ctx.client?.id ?? ""}
                        onValueChange={(val: string) => {
                            const found = clients.find((c) => c.id === val);
                            if (found) onSelectClient(found);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Search or select client" />
                        </SelectTrigger>
                        <SelectContent>
                            {loading ? (
                                <div className="p-2 text-xs text-muted-foreground">Loading clients...</div>
                            ) : (
                                clients.map((client) => (
                                    <SelectItem key={client.id} value={client.id}>
                                        {client.name} · {client.email}
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {mode === "new" && (
                <div className="space-y-3">
                    <div className="space-y-1">
                        <Label className="text-xs">Name</Label>
                        <Input
                            value={newName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
                            placeholder="Client name"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Email</Label>
                        <Input
                            value={newEmail}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEmail(e.target.value)}
                            placeholder="client@example.com"
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            if (!newName || !newEmail) return;
                            const tempClient: Client = {
                                id: crypto.randomUUID(),
                                name: newName,
                                email: newEmail,
                                isTemp: true,
                            };
                            onSelectClient(tempClient);
                        }}
                    >
                        Use this client
                    </Button>
                </div>
            )}
        </div>
    );
}

function ServiceStep({
    ctx,
    services,
    loading,
    onSelectService,
}: {
    ctx: BookingContext;
    services: Service[];
    loading: boolean;
    onSelectService: (s: Service) => void;
}) {
    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-base">Select service</h3>
            <p className="text-xs text-muted-foreground">
                Choose what you’ll be working on so we can set the right duration and deposit.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
                {loading && <p className="text-sm text-muted-foreground">Loading services...</p>}
                {!loading && services.map((service) => {
                    const active = ctx.service?.id === service.id;
                    return (
                        <button
                            key={service.id}
                            type="button"
                            onClick={() => onSelectService(service)}
                            className={[
                                "flex flex-col items-start rounded-lg border p-3 text-left text-sm transition",
                                active
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/60 hover:bg-muted/60",
                            ].join(" ")}
                        >
                            <span className="font-medium">{service.name}</span>
                            <span className="mt-1 text-xs text-muted-foreground">
                                {service.durationMinutes} min · ${service.depositAmount} deposit
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ---- API Helper for Projects ---- //
async function fetchProjectsForClient(clientId: string): Promise<any[]> {
    const res = await fetch(`/api/projects/list?clientId=${clientId}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.projects || [];
}

// ... (Inside ProjectStep)

function ProjectStep({
    ctx,
    onChangeTitle,
    onChangeDescription,
    onSelectProject, // New prop
}: {
    ctx: BookingContext;
    onChangeTitle: (val: string) => void;
    onChangeDescription: (val: string) => void;
    onSelectProject: (id: string | undefined) => void;
}) {
    const [existingProjects, setExistingProjects] = React.useState<any[]>([]);
    const [loadingProjects, setLoadingProjects] = React.useState(false);
    const [mode, setMode] = React.useState<"new" | "existing">("new");

    React.useEffect(() => {
        if (ctx.client && !ctx.client.isTemp) {
            setLoadingProjects(true);
            fetchProjectsForClient(ctx.client.id)
                .then(setExistingProjects)
                .finally(() => setLoadingProjects(false));
        }
    }, [ctx.client]);

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-base">Project Details</h3>
            <p className="text-xs text-muted-foreground">
                Link this booking to a project.
            </p>

            {/* Selection Mode */}
            {existingProjects.length > 0 && (
                <div className="flex gap-2 text-xs mb-2">
                    <Button
                        variant={mode === "new" ? "default" : "outline"}
                        size="xs"
                        onClick={() => {
                            setMode("new");
                            onSelectProject(undefined); // Clear ID
                        }}
                    >
                        New Project
                    </Button>
                    <Button
                        variant={mode === "existing" ? "default" : "outline"}
                        size="xs"
                        onClick={() => setMode("existing")}
                    >
                        Existing Project
                    </Button>
                </div>
            )}

            {mode === "existing" && existingProjects.length > 0 ? (
                <div className="space-y-2">
                    <Label className="text-xs">Select Active Project</Label>
                    <Select
                        onValueChange={(val: string) => {
                            const p = existingProjects.find(ep => ep.id === val);
                            if (p) {
                                onChangeTitle(p.title);
                                onChangeDescription(p.description || ""); // Pre-fill?
                                onSelectProject(p.id);
                            }
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Choose a project..." />
                        </SelectTrigger>
                        <SelectContent>
                            {existingProjects.map(p => (
                                <SelectItem key={p.id} value={p.id}>
                                    {p.title} ({p.status})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="space-y-1">
                        <Label className="text-xs">Project Title</Label>
                        <Input
                            value={ctx.projectTitle || ""}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeTitle(e.target.value)}
                            placeholder="e.g. Lion on Forearm"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Description / Notes</Label>
                        <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={ctx.projectDescription || ""}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChangeDescription(e.target.value)}
                            placeholder="Placement, size, reference ideas..."
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// ... (Inside DateTimeStep)

function DateTimeStep({
    ctx,
    slots,
    loadingSlots,
    onChangeDate,
    onSelectSlot,
}: {
    ctx: BookingContext;
    slots: Slot[];
    loadingSlots: boolean;
    onChangeDate: (date: string) => void;
    onSelectSlot: (slot: Slot) => void;
}) {
    const [localDate, setLocalDate] = React.useState(ctx.date ?? "");

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-base">Select date & time</h3>

            <div className="space-y-3">
                <div className="space-y-1">
                    <Label className="text-xs">Date</Label>
                    <div className="relative flex-1">
                        <Input
                            type="date"
                            value={localDate}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const val = e.target.value;
                                setLocalDate(val);
                                onChangeDate(val);
                            }}
                            className="pr-9 text-foreground bg-background" // Ensure visibility
                        />
                        <CalendarIcon className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-xs">Available time slots</Label>

                    {/* LOADING STATE */}
                    {loadingSlots && (
                        <p className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Loading available times…
                        </p>
                    )}

                    {/* EMPTY STATE */}
                    {!loadingSlots && localDate && slots.length === 0 && (
                        <p className="text-xs text-destructive py-2">
                            No available times for this date. Try another day.
                        </p>
                    )}

                    {/* INSTRUCTIONS */}
                    {!loadingSlots && !localDate && (
                        <p className="text-xs text-muted-foreground py-2">
                            Pick a date to see available times.
                        </p>
                    )}

                    {/* SLOTS LIST */}
                    {!loadingSlots && slots.length > 0 && (
                        <div className="flex flex-wrap gap-2 animate-in fade-in duration-300">
                            {slots.map((slot) => {
                                const isActive =
                                    ctx.slot?.start === slot.start &&
                                    ctx.slot?.end === slot.end;

                                // Format: "2:00 PM – 3:00 PM"
                                const label = `${format(new Date(slot.start), "p")} – ${format(
                                    new Date(slot.end),
                                    "p"
                                )}`;

                                return (
                                    <button
                                        key={slot.start}
                                        type="button"
                                        onClick={() => onSelectSlot(slot)}
                                        className={[
                                            "rounded-md border px-3 py-2 text-xs transition font-medium",
                                            isActive
                                                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                                : "border-border bg-card hover:border-primary/60 hover:bg-muted",
                                        ].join(" ")}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ReviewStep({ ctx }: { ctx: BookingContext }) {
    if (!ctx.client || !ctx.service || !ctx.slot) {
        return (
            <p className="text-sm text-muted-foreground">
                Missing booking details. Go back and complete each step.
            </p>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-base">Review booking details</h3>
            <div className="space-y-3 text-sm">
                <div>
                    <span className="text-xs uppercase text-muted-foreground">
                        Client
                    </span>
                    <p className="font-medium">
                        {ctx.client.name}{" "}
                        <span className="text-xs text-muted-foreground">
                            · {ctx.client.email}
                        </span>
                    </p>
                </div>

                <div>
                    <span className="text-xs uppercase text-muted-foreground">
                        Service
                    </span>
                    <p className="font-medium">
                        {ctx.service.name} · {ctx.service.durationMinutes} min
                    </p>
                </div>

                <div>
                    <span className="text-xs uppercase text-muted-foreground">
                        Time
                    </span>
                    <p className="font-medium">
                        {format(new Date(ctx.slot.start), "EEE, MMM d yyyy · p")} –{" "}
                        {format(new Date(ctx.slot.end), "p")}
                    </p>
                </div>

                <div>
                    <span className="text-xs uppercase text-muted-foreground">
                        Deposit
                    </span>
                    <p className="font-medium">${ctx.service.depositAmount}</p>
                </div>
            </div>

            <p className="text-xs text-muted-foreground">
                When you confirm, InkFlow-OS will create the booking and generate a
                Stripe deposit link you can share with the client.
            </p>
        </div>
    );
}

function DoneStep({
    ctx,
    onReset,
}: {
    ctx: BookingContext;
    onReset: () => void;
}) {
    return (
        <div className="space-y-4 text-sm animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200">
                    <Check className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="font-semibold text-base">Booking created!</h3>
                    <p className="text-xs text-muted-foreground">
                        Deposit link is ready to share with your client.
                    </p>
                </div>
            </div>

            {ctx.depositUrl && (
                <Card className="bg-muted/40 border-dashed">
                    <CardContent className="p-4 space-y-2">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground">Deposit Link</Label>
                        <div className="flex items-center gap-2">
                            <Input value={ctx.depositUrl} readOnly className="text-xs bg-background" />
                            <Button
                                size="icon"
                                variant="outline"
                                className="shrink-0"
                                onClick={() => {
                                    navigator.clipboard.writeText(ctx.depositUrl || "");
                                }}
                                title="Copy to clipboard"
                            >
                                <Check className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            Send this link to the client to confirm their appointment.
                        </p>
                    </CardContent>
                </Card>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
                <Button variant="outline" size="sm" onClick={onReset}>
                    New Booking
                </Button>
            </div>
        </div>
    );
}
