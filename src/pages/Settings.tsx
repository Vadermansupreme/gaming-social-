import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, User, Bell, Shield, HelpCircle, Settings as SettingsIcon, MessageSquareWarning, LayoutDashboard, LogOut, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FeedbackModal } from "@/components/FeedbackModal";
import { useAdminStatus } from "@/hooks/useAdminStatus";

const Settings = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [userId, setUserId] = useState<string | undefined>();
  const { isAdmin } = useAdminStatus(userId);
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    zip_code: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      setUserId(user.id);

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setProfile(profileData);
      if (profileData) {
        setFormData({
          display_name: profileData.display_name || '',
          bio: profileData.bio || '',
          zip_code: (profileData as any).zip_code || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: formData.display_name,
          bio: formData.bio,
          zip_code: formData.zip_code
        } as any)
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Settings</h1>
          <div className="w-10"></div>
        </div>
      
        {/* Settings Menu */}
        <div className="space-y-1">
          {/* Admin Dashboard - only show for admins */}
          {isAdmin && (
            <Button
              variant="ghost"
              className="w-full justify-start h-14 px-4 text-primary"
              onClick={() => navigate('/admin')}
            >
              <LayoutDashboard className="w-5 h-5 mr-3" />
              <span>Admin Dashboard</span>
            </Button>
          )}

          <Button
            variant="ghost"
            className="w-full justify-start h-14 px-4"
            onClick={() => navigate("/profile/edit")}
          >
            <User className="w-5 h-5 mr-3" />
            <span>Account Settings</span>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start h-14 px-4"
            onClick={() => navigate('/notification-settings')}
          >
            <Bell className="w-5 h-5 mr-3" />
            <span>Notifications</span>
          </Button>
          <Button
  variant="ghost"
  className="w-full justify-start h-14 px-4"
  onClick={() => navigate('/activity')}
>
  <Heart className="w-5 h-5 mr-3 text-emerald-500" />
  <span>Activity</span>
</Button>

          <Button
            variant="ghost"
            className="w-full justify-start h-14 px-4"
            onClick={() => navigate('/privacy-security')}
          >
            <Shield className="w-5 h-5 mr-3" />
            <span>Privacy & Security</span>
          </Button>

          <Separator className="my-4" />

          <Button
            variant="ghost"
            className="w-full justify-start h-14 px-4"
            onClick={() => navigate('/app-settings')}
          >
            <SettingsIcon className="w-5 h-5 mr-3" />
            <span>App Settings</span>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start h-14 px-4"
            onClick={() => navigate('/help-support')}
          >
            <HelpCircle className="w-5 h-5 mr-3" />
            <span>Help & Support</span>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start h-14 px-4"
            onClick={() => setShowFeedback(true)}
          >
            <MessageSquareWarning className="w-5 h-5 mr-3" />
            <span>Send Feedback</span>
          </Button>

          <Separator className="my-4" />

          <Button
            variant="ghost"
            className="w-full justify-start h-14 px-4 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate('/');
              toast.success('Signed out successfully');
            }}
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>

      <FeedbackModal open={showFeedback} onClose={() => setShowFeedback(false)} />
    </div>
  );
};

export default Settings;
