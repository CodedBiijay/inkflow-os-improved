import Stripe from "stripe";
import { supabase } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-11-17.clover", // Matching the exact type expected by the SDK
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { booking_id } = body;

        if (!booking_id) {
            return new Response(JSON.stringify({ error: "booking_id is required" }), {
                status: 400,
            });
        }

        // Fetch booking to get deposit amount
        const { data: booking, error } = await supabase
            .from("bookings")
            .select("deposit_amount")
            .eq("id", booking_id)
            .single();

        if (error || !booking) {
            return new Response(JSON.stringify({ error: "Booking not found" }), {
                status: 404,
            });
        }

        const deposit = booking.deposit_amount * 100; // Convert to cents

        // Create Payment Link
        const paymentLink = await stripe.paymentLinks.create({
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        unit_amount: deposit,
                        product_data: {
                            name: `Tattoo Deposit for Booking ${booking_id}`,
                        },
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                booking_id: booking_id,
            },
        });

        // Save payment link to database
        const { error: updateError } = await supabase
            .from("bookings")
            .update({ deposit_link: paymentLink.url })
            .eq("id", booking_id);

        if (updateError) {
            console.error("Failed to save deposit link:", updateError);
            // We continue anyway so the user gets the link in the response
        }

        return new Response(
            JSON.stringify({ url: paymentLink.url }),
            { status: 200 }
        );

    } catch (err: any) {
        return new Response(
            JSON.stringify({ error: err.message }),
            { status: 500 }
        );
    }
}
