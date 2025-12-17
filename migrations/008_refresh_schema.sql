-- Force refresh of PostgREST schema cache
NOTIFY pgrst, 'reload schema';
