-- Realtime apenas nas tabelas necessárias à timeline do cliente (ARCHITECTURE §6).
alter publication supabase_realtime add table public.phases;
alter publication supabase_realtime add table public.tasks;
