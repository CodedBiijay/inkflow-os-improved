import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      artist_id,
      client_id,
      service_id,
      start_time,
      end_time,
      deposit_amount
    } = body;

    if (!artist_id || !client_id || !service_id || !start_time || !end_time) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    if (!body.project_id) {
      // Auto-create project
      const { data: newProject, error: projError } = await supabase
        .from("projects")
        .insert({
          client_id,
          service_id,
          title: "New Booking Project", // Default title
          status: "session_scheduled",
          description: "Auto-created from booking"
        })
        .select()
        .single();

      if (projError) {
        console.error("Auto-create project failed:", projError);
        return new Response(JSON.stringify({ error: "Failed to auto-create project: " + projError.message }), { status: 500 });
      }
      body.project_id = newProject.id;
    }

    const projectId = body.project_id;

    // Create booking with deposit_due status
    const { data: booking, error } = await supabase
      .from("bookings")
      .insert({
        artist_id,
        client_id,
        service_id,
        project_id: projectId,
        start_time,
        end_time,
        deposit_amount,
        status: "deposit_due" // Waiting for Stripe deposit
      })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error }), { status: 400 });
    }

    // ---- Sync Project Status ----
    if (body.project_id) {
      // 1. Link last_booking_id
      await supabase
        .from("projects")
        .update({ last_booking_id: booking.id })
        .eq("id", body.project_id);

      // 2. Check and auto-advance status
      // If project is just in intake or design, and we scheduled a session, it implies we are moving forward.
      // The rule requested: If status IN (intake, design, awaiting_approval, approved) -> session_scheduled
      const { data: project } = await supabase
        .from("projects")
        .select("status")
        .eq("id", body.project_id)
        .single();

      const autoAdvanceStages = ["intake", "design", "awaiting_approval", "approved"];

      if (project && autoAdvanceStages.includes(project.status)) {
        await supabase
          .from("projects")
          .update({ status: "session_scheduled" })
          .eq("id", body.project_id);
      }
    }

    return new Response(JSON.stringify({ booking }), { status: 200 });

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}
