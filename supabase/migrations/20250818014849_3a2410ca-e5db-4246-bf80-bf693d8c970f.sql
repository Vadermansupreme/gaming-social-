-- First, add conversation_id column to messages table
ALTER TABLE public.messages 
  ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS read_by jsonb DEFAULT '[]';