import Stripe from "stripe";
import { supabase } from "@/lib/supabase";
import { sendConfirmationEmail } from "@/lib/email";

export const runtime = "nodejs"; // required for Stripe SDK

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-11-17.clover",
});


export async function POST(request: Request) {
    const sig = request.headers.get("stripe-signature");

    if (!sig) {
        return new Response("Missing Stripe signature", { status: 400 });
    }

    let event: Stripe.Event;

    try {
        // Stripe needs the RAW body, not JSON-parsed
        const payload = await request.text();

        event = stripe.webhooks.constructEvent(
            payload,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Handle successful payment events
    // Cast to string to avoid "no overlap" error if types are missing 'payment_link.paid'
    const eventType = event.type as string;

    if (
        eventType === "payment_intent.succeeded" ||
        eventType === "checkout.session.completed" ||
        eventType === "payment_link.paid"
    ) {
        const obj: any = event.data.object;
        const bookingId = obj.metadata?.booking_id;

        if (!bookingId) {
            console.error("No booking_id in metadata");
            return new Response("No booking_id in metadata", { status: 400 });
        }

        // Update booking in Supabase
        const { data: booking, error } = await supabase
            .from("bookings")
            .update({
                deposit_paid: true,
                status: "confirmed",
            })
            .eq("id", bookingId)
            .eq("id", bookingId)
            .select("project_id, artist_id") // Fetch project_id to sync, artist_id for notification
            .single();

        if (error) {
            console.error("Error updating booking:", error);
            return new Response("Failed to update booking", { status: 500 });
        }

        // ---- Sync Project Status ----
        if (booking?.project_id) {
            const { data: project } = await supabase
                .from("projects")
                .select("status")
                .eq("id", booking.project_id)
                .single();

            if (project && project.status === "intake") {
                await supabase
                    .from("projects")
                    .update({ status: "design" })
                    .eq("id", booking.project_id);
            }
        }

        // ---- Trigger Notification: Deposit Paid ----
        if (booking?.artist_id) {
            await supabase.from("notifications").insert({
                artist_id: booking.artist_id,
                type: "deposit_paid",
                title: "Deposit Paid",
                body: `Deposit received for booking ${bookingId.slice(0, 8)}.`,
                entity_type: "booking",
                entity_id: bookingId
            });
        }

        // ---- Send Confirmation Email ----
        try {
            await sendConfirmationEmail(bookingId);
        } catch (emailErr) {
            console.error("Failed to send confirmation email:", emailErr);
            // Don't fail the webhook for email issues
        }

        console.log(`Booking ${bookingId} confirmed via Stripe webhook`);
    }

    return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}
