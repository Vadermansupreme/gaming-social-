-- Enable realtime on messages table (only if not already enabled)
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Create conversations table for message threads
CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1 uuid NOT NULL,
  participant_2 uuid NOT NULL,
  last_message_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(participant_1, participant_2)
);

-- Enable RLS on conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Create policies for conversations
CREATE POLICY "Users can view their own conversations" 
ON public.conversations 
FOR SELECT 
USING ((auth.uid() = participant_1) OR (auth.uid() = participant_2));

CREATE POLICY "Users can create conversations they participate in" 
ON public.conversations 
FOR INSERT 
WITH CHECK ((auth.uid() = participant_1) OR (auth.uid() = participant_2));

-- Enable realtime on conversations
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  read boolean DEFAULT false,
  data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Enable realtime on notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;