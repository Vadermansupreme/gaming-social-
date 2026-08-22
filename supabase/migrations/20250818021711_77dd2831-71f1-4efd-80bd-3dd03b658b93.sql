-- Remove the thread_id requirement from messages table
ALTER TABLE public.messages 
  ALTER COLUMN thread_id DROP NOT NULL;

-- Update messages RLS policies to use conversation_id
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to conversations they're in" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.messages;

CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR SELECT USING (
    conversation_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.conversation_members cm 
      WHERE cm.conversation_id = messages.conversation_id 
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to conversations they're in" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    conversation_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.conversation_members cm 
      WHERE cm.conversation_id = messages.conversation_id 
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in their conversations" ON public.messages
  FOR UPDATE USING (
    conversation_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.conversation_members cm 
      WHERE cm.conversation_id = messages.conversation_id 
      AND cm.user_id = auth.uid()
    )
  );