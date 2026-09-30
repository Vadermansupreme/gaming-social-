
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const MAX_MESSAGE_LENGTH = 2000;

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  text: string;
  created_at: string;
}

export const useRealTimeMessages = (recipientId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadMessages = useCallback(async () => {
    if (!user || !recipientId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const formattedMessages: Message[] = (data || []).map(msg => ({
        id: msg.id,
        sender_id: msg.sender_id,
        recipient_id: msg.recipient_id,
        text: msg.text,
        created_at: msg.created_at
      }));
      
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }, [user, recipientId]);

  const sendMessage = async (text: string) => {
    if (!user || !recipientId || !text.trim()) return;

    // Enforce message length limit
    if (text.trim().length > MAX_MESSAGE_LENGTH) {
      toast.error(`Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters allowed.`);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          text: text.trim()
        })
        .select()
        .single();

      if (error) throw error;

      const newMessage: Message = {
        id: data.id,
        sender_id: data.sender_id,
        recipient_id: data.recipient_id,
        text: data.text,
        created_at: data.created_at
      };

      setMessages(prev => [...prev, newMessage]);
      const { error: notificationError } = await (supabase as any)
  .from("notifications")
  .insert({
    user_id: recipientId,
    actor_id: user.id,
    type: "message",
    message: text.trim(),
    is_read: false,
    related_id: null,
    link: `/chat/${user.id}`,
  });

if (notificationError) {
  console.error("Error creating message notification:", notificationError);
}
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadMessages();

    if (!user || !recipientId) return;

    // Subscribe to new messages in this conversation
    const channel = supabase
      .channel(`messages:${user.id}:${recipientId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMessage = payload.new as any;
          
          // Only add if message is part of this conversation
          const isRelevant = 
            (newMessage.sender_id === user.id && newMessage.recipient_id === recipientId) ||
            (newMessage.sender_id === recipientId && newMessage.recipient_id === user.id);
          
          if (isRelevant) {
            const formattedMessage: Message = {
              id: newMessage.id,
              sender_id: newMessage.sender_id,
              recipient_id: newMessage.recipient_id,
              text: newMessage.text,
              created_at: newMessage.created_at
            };
            
            setMessages(prev => {
              const exists = prev.some(msg => msg.id === formattedMessage.id);
              return exists ? prev : [...prev, formattedMessage];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadMessages, user, recipientId]);

  return {
    messages,
    loading,
    sendMessage,
    refetch: loadMessages
  };
};
