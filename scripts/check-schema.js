const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
    console.log('Checking schema for projects.status column...');

    // Method 1: Query information_schema (requires permissions, often blocked on Supabase via client)
    // But Service Role key might bypass RLS/permissions if allowed.
    // Actually, Supabase JS client doesn't support querying information_schema easily unless using .rpc() or specific query.
    // We'll try to insert a string that is NOT in the enum (if it is one) and see the error message.
    // Or just try to select one row and see the type returned (string).

    // Query to check if we can simply get the data type via inspection or failure.
    // Let's rely on the error message from an invalid update effectively telling us if it's an enum.

    // Actually, we can just try to SELECT column_name, data_type FROM information_schema.columns...
    // but supabase-js .from() implies 'public' schema usually.

    // Alternative: Try to update a dummy ID with a random string "CheckingTypeTest"
    // If it fails with "invalid input value for enum...", it's an enum.
    // If it fails with "constraint violation", it's a text with a check constraint.
    // If it succeeds (or would succeed if ID existed), it's text.

    const testStatus = "NON_EXISTENT_STATUS_CHECK_" + Date.now();

    // We use a dummy ID that definitely doesn't exist
    const dummyId = "00000000-0000-0000-0000-000000000000";

    const { error } = await supabase
        .from('projects')
        .update({ status: testStatus })
        .eq('id', dummyId);

    if (error) {
        console.log("Error encountered:", error.message);
        if (error.message.includes("invalid input value for enum")) {
            console.log("RESULT: Column is an ENUM.");
        } else if (error.message.includes("violates check constraint")) {
            console.log("RESULT: Column is TEXT with CHECK constraint.");
        } else {
            console.log("RESULT: Error is generic/other. Could be TEXT.");
        }
    } else {
        console.log("RESULT: No error (row didn't exist, but type check passed). Column is likely TEXT.");
    }
}

checkSchema();
