
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email } = body;

        if (!name || !email) {
            return NextResponse.json(
                { error: "Name and email are required" },
                { status: 400 }
            );
        }

        // Check if client exists (optional, but good practice to avoid duplicates if email unique)
        // For now, simpler to just insert or maybe select.
        // The previous instruction implied direct insert.

        const { data, error } = await supabase
            .from("clients")
            .insert({ name, email })
            .select()
            .single();

        if (error) {
            throw error;
        }

        return NextResponse.json({ client: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
