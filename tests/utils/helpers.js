
import { supabase, TEST_DATA } from './env.js';

export const SeedHelper = {
    ...TEST_DATA, // Inherit static IDs

    tomorrowAt: (time) => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const [hours, mins] = time.split(':');
        tomorrow.setHours(parseInt(hours, 10), parseInt(mins, 10), 0, 0);
        return tomorrow.toISOString(); // Output canonical ISO string (e.g. 2023-10-05T14:30:00.000Z)
    },

    basicEntities: async () => {
        // In a real app, this might create fresh random users.
        // For now, return our static test data as "entities".
        return {
            client: { id: TEST_DATA.client_id },
            artist: { id: TEST_DATA.artist_id },
            service: { id: TEST_DATA.service_id }
        };
    },

    createBooking: async (overrides = {}) => {
        const start = overrides.start_time || SeedHelper.tomorrowAt("10:00");
        const end = overrides.end_time || SeedHelper.tomorrowAt("11:00");
        const projectId = overrides.hasOwnProperty('project_id') ? overrides.project_id : TEST_DATA.project_id;

        // Ensure Project Exists and matches Client/Service (Fix for "Auto-create" test lookup)
        if (projectId) {
            const { error: upsertErr } = await supabase.from('projects').upsert({
                id: projectId,
                client_id: TEST_DATA.client_id,
                service_id: TEST_DATA.service_id,
                status: 'session_scheduled'
            });
            if (upsertErr) console.error("DEBUG: Project Upsert Error:", upsertErr);
        }

        const { data: booking, error } = await supabase.from('bookings').insert({
            client_id: TEST_DATA.client_id,
            artist_id: TEST_DATA.artist_id,
            service_id: TEST_DATA.service_id,
            project_id: overrides.hasOwnProperty('project_id') ? overrides.project_id : TEST_DATA.project_id,
            start_time: start,
            end_time: end,
            deposit_amount: 50,
            status: 'deposit_due'
        }).select().single();

        if (error) throw error;
        return booking;
    },

    createProject: async (status = 'design') => {
        // Cleanup existing project for this client/service pair to avoid collision if strict constraint exists
        // or just rely on random IDs if we had them. ideally we reuse TEST_DATA.project_id
        // But if we want to create A NEW project, we might need a unique service or client?
        // Or we just update the existing TEST_DATA project to the desired state?
        // The test "Drag & Drop Stage Update" implies creating a project then updating it.
        // User snippet: seed.createProject("design").
        // Let's try to update the MAIN project to "design" first, return it.
        // If unique constraints block multiple projects, this is safest.

        const { data, error } = await supabase.from('projects')
            .update({
                status: status,
                artist_id: TEST_DATA.artist_id
            })
            .eq('id', TEST_DATA.project_id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    createProjectWithIntake: async () => {
        const project = await SeedHelper.createProject('intake');

        // Create a dummy intake form linked to it
        const { data: intake } = await supabase.from('intake_forms').insert({
            project_id: project.id,
            client_id: TEST_DATA.client_id,
            description: "Mock Intake Description",
            placement: "Arm",
            size_estimate: "Large",
            color_preference: "B&W",
            medical_notes: "None",
            reference_images: [] // Empty for now
        }).select().single();

        await supabase.from('projects').update({
            intake_form_id: intake.id,
            status: 'design' // Usually intake -> design after submission
        }).eq('id', project.id);

        return { ...project, status: 'design', intake_form_id: intake.id };
    },

    mockImages: async (count = 1) => {
        // Return array of base64 strings mimicking files
        // Format: { name, type, content (base64) } or just content?
        // API needs to handle it. Let's return objects.
        const images = [];
        for (let i = 0; i < count; i++) {
            images.push({
                name: `mock_img_${i}.jpg`,
                type: 'image/jpeg',
                // tiny 1x1 pixel jpeg base64
                content: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="
            });
        }
        return images;
    },

    createProjectWithBooking: async () => {
        // Reset project to session_scheduled
        const project = await SeedHelper.createProject('session_scheduled');

        // Ensure no other active bookings exist (Clean state for completion logic)
        // Must unlink project.last_booking_id first just in case
        await supabase.from('projects').update({ last_booking_id: null }).eq('id', project.id);
        await supabase.from('bookings').delete().eq('project_id', project.id);

        // Create a booking linked to it
        // Ensure no conflict with other tests
        const booking = await SeedHelper.createBooking({
            start_time: SeedHelper.tomorrowAt("15:00"),
            end_time: SeedHelper.tomorrowAt("16:00")
        });

        return { project, booking };
    }
};

export const DBHelper = {
    // Delegate 'from' and standard methods to supabase
    // We can't easily spread supabase instance properties, so we delegate common ones 
    // or we construct this inside run.js by merging.

    // Custom Helpers
    bookingById: async (id) => {
        const { data, error } = await supabase.from('bookings').select('*').eq('id', id).single();
        if (error) throw error;
        return data;
    },

    projectById: async (id) => {
        const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();
        if (error) throw error;
        return data;
    },

    projectByClientAndService: async (clientId, serviceId) => {
        const { data, error } = await supabase.from('projects')
            .select('*')
            .eq('client_id', clientId)
            .eq('service_id', serviceId)
            // .single() can fail if multiple or zero. Let's see raw count or use maybeSingle
            .select('*');

        if (error) throw error;
        if (!data || data.length === 0) return null;
        return data[0];
    },

    messagesForProject: async (projectId) => {
        const { data, error } = await supabase
            .from('project_messages')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data;
    },

    notificationsForArtist: async (artistId) => {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('artist_id', artistId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    }
};
