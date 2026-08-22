import { useState, useEffect } from "react";
import { ArrowLeft, Bell, MessageSquare, Users, Heart, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const NotificationSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [preferences, setPreferences] = useState({
    notify_messages: true,
    notify_spot_requests: true,
    notify_new_followers: true,
    notify_likes: true,
    notify_comments: true,
    notify_meetup_reminders: true,
  });

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('notify_messages, notify_spot_requests, notify_new_followers, notify_likes, notify_comments, notify_meetup_reminders')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching notification preferences:', error);
      } else if (data) {
        setPreferences({
          notify_messages: data.notify_messages ?? true,
          notify_spot_requests: data.notify_spot_requests ?? true,
          notify_new_followers: data.notify_new_followers ?? true,
          notify_likes: data.notify_likes ?? true,
          notify_comments: data.notify_comments ?? true,
          notify_meetup_reminders: data.notify_meetup_reminders ?? true,
        });
      }
      setLoading(false);
    };

    fetchPreferences();
  }, [user]);

  const updatePreference = async (key: keyof typeof preferences, value: boolean) => {
    if (!user) return;

    setSaving(key);
    const { error } = await supabase
      .from('profiles')
      .update({ [key]: value })
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to update preference');
      console.error('Error updating preference:', error);
    } else {
      setPreferences(prev => ({ ...prev, [key]: value }));
      toast.success('Preference updated');
    }
    setSaving(null);
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="px-4 pt-6 pb-24 max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-end))] bg-clip-text text-transparent">
            Notification Settings
          </h1>
        </div>

        <div className="p-4 mb-4 bg-black rounded-2xl border border-white/20">
          <p className="text-sm text-white/50">
            Manage your in-app notification preferences below. Push and email delivery are coming soon.
          </p>
        </div>

        <div className="space-y-6">
          {/* General Notifications - Coming Soon */}
          <Card className="bg-black border border-white/20 rounded-2xl p-5">
            <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
              <Bell className="w-5 h-5" />
              General
            </h3>
            <div className="space-y-4 opacity-80">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-foreground">Push Notifications</Label>
                  <p className="text-sm text-white/50"></p>
                </div>
                <Switch
                  checked={true}
                  disabled
                  className="cursor-not-allowed data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-white/20"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-foreground">Email Notifications</Label>
                  <p className="text-sm text-white/50"></p>
                </div>
                <Switch
                  checked={true}
                  disabled
                  className="cursor-not-allowed data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-white/20"
                />
              </div>
            </div>
          </Card>

          {/* Social Notifications */}
          <Card className="bg-black border border-white/20 rounded-2xl p-5">
            <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
              <Users className="w-5 h-5" />
              Social
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-foreground">Messages</Label>
                  <p className="text-sm text-white/50">New message notifications</p>
                </div>
                <Switch
                  checked={preferences.notify_messages}
                  onCheckedChange={(checked) => updatePreference('notify_messages', checked)}
                  disabled={loading || saving === 'notify_messages'}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-foreground">Spot Requests</Label>
                  <p className="text-sm text-white/50">When someone wants to work out with you</p>
                </div>
                <Switch
                  checked={preferences.notify_spot_requests}
                  onCheckedChange={(checked) => updatePreference('notify_spot_requests', checked)}
                  disabled={loading || saving === 'notify_spot_requests'}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-foreground">New Followers</Label>
                  <p className="text-sm text-white/50">When someone follows you</p>
                </div>
                <Switch
                  checked={preferences.notify_new_followers}
                  onCheckedChange={(checked) => updatePreference('notify_new_followers', checked)}
                  disabled={loading || saving === 'notify_new_followers'}
                />
              </div>
            </div>
          </Card>

          {/* Activity Notifications */}
          <Card className="bg-black border border-white/20 rounded-2xl p-5">
            <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Activity
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-foreground">Likes</Label>
                  <p className="text-white/50">When someone likes your posts</p>
                </div>
                <Switch
  className="w-12 h-7 bg-white/10 data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-white/20 transition-all duration-300 shadow-inner data-[state=checked]:shadow-[0_0_12px_rgba(16,185,129,0.8)]"
                  checked={preferences.notify_likes}
                  onCheckedChange={(checked) => updatePreference('notify_likes', checked)}
                  disabled={loading || saving === 'notify_likes'}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-foreground">Comments</Label>
                  <p className="text-white/50">When someone comments on your posts</p>
                </div>
                <Switch
  className="w-12 h-7 bg-white/10 data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-white/20 transition-all duration-300 shadow-inner data-[state=checked]:shadow-[0_0_12px_rgba(16,185,129,0.8)]"
                  checked={preferences.notify_comments}
                  onCheckedChange={(checked) => updatePreference('notify_comments', checked)}
                  disabled={loading || saving === 'notify_comments'}
                />
              </div>
            </div>
          </Card>

          {/* Reminders */}
          <Card className="bg-black border border-white/20 rounded-2xl p-5">
            <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Reminders
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-foreground">Meetup Reminders</Label>
                  <p className="text-white/50">Reminders for upcoming workouts</p>
                </div>
                <Switch
                  checked={preferences.notify_meetup_reminders}
                  onCheckedChange={(checked) => updatePreference('notify_meetup_reminders', checked)}
                  disabled={loading || saving === 'notify_meetup_reminders'}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
