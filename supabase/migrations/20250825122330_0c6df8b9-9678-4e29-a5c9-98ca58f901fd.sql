
-- Fix conversations and messages structure (idempotent)
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  participant_1 uuid references auth.users(id) on delete cascade,
  participant_2 uuid references auth.users(id) on delete cascade,
  last_message_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  unique(participant_1, participant_2)
);

-- Update messages table to use conversation_id properly
alter table public.messages add column if not exists conversation_id uuid references public.conversations(id) on delete cascade;

-- Add index for better performance
create index if not exists idx_messages_conversation_created on public.messages (conversation_id, created_at desc);
create index if not exists idx_conversations_participants on public.conversations (participant_1, participant_2);

-- RLS policies for conversations
alter table public.conversations enable row level security;

drop policy if exists "Users can view their conversations" on public.conversations;
create policy "Users can view their conversations" 
on public.conversations for select 
using (auth.uid() = participant_1 or auth.uid() = participant_2);

drop policy if exists "Users can create conversations" on public.conversations;
create policy "Users can create conversations" 
on public.conversations for insert 
with check (auth.uid() = participant_1 or auth.uid() = participant_2);
