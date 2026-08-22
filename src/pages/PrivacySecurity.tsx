import { useState, useEffect } from "react";
import { ArrowLeft, Shield, Lock, Eye, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PrivacySecurity = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: true,
    shareWorkouts: true,
    allowMessages: true,
  });
  
  // Change Password state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_visible, discoverable, allow_messages')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setPrivacySettings({
          profileVisibility: data.is_visible ?? true,
          shareWorkouts: data.discoverable ?? true,
          allowMessages: data.allow_messages ?? true
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: boolean) => {
    if (!user) return;

    setSaving(true);
    try {
      let updateData: Record<string, boolean> = {};
      
      if (key === 'profileVisibility') {
        updateData = { is_visible: value };
      } else if (key === 'shareWorkouts') {
        updateData = { discoverable: value };
      } else if (key === 'allowMessages') {
        updateData = { allow_messages: value };
      }

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', user.id);

        if (error) throw error;
      }

      setPrivacySettings(prev => ({ ...prev, [key]: value }));
      toast.success('Setting updated');
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in both password fields");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success("Password updated successfully");
      setShowPasswordDialog(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || "Failed to update password");
    } finally {
      setChangingPassword(false);
    }
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
            Privacy & Security
          </h1>
        </div>

        <div className="space-y-6">
          {/* Privacy Settings - Functional */}
          <Card className="bg-black border border-white/20 rounded-2xl p-5">
            <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Privacy Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-foreground">Profile Visibility</Label>
                  <p className="text-sm text-white/50">Allow others to find your profile</p>
                </div>
                <Switch
                  checked={privacySettings.profileVisibility}
                  onCheckedChange={(checked) => updateSetting('profileVisibility', checked)}
                  disabled={saving || loading}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-foreground">Share Workouts</Label>
                  <p className="text-sm text-white/50">Allow others to see your workout posts</p>
                </div>
                <Switch
                  checked={privacySettings.shareWorkouts}
                  onCheckedChange={(checked) => updateSetting('shareWorkouts', checked)}
                  disabled={saving || loading}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-foreground">Allow Messages</Label>
                  <p className="text-sm text-white/50">Receive messages from other users</p>
                </div>
                <Switch
                  checked={privacySettings.allowMessages}
                  onCheckedChange={(checked) => updateSetting('allowMessages', checked)}
                  disabled={saving || loading}
                />
              </div>
            </div>
          </Card>

          {/* Coming Soon Settings */}
          <Card className="bg-black border border-white/20 rounded-2xl p-5 opacity-60">
            <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Additional Privacy
              <span className="text-xs text-white/50 font-normal">(Coming soon)</span>
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-foreground">Show Online Status</Label>
                  <p className="text-sm text-white/50">Let others see when you're online</p>
                </div>
                <Switch
                  checked={true}
                  disabled
                  className="cursor-not-allowed"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-foreground">Location Visible</Label>
                  <p className="text-sm text-white/50">Show your location to nearby users</p>
                </div>
                <Switch
                  checked={false}
                  disabled
                  className="cursor-not-allowed"
                />
              </div>
            </div>
          </Card>

          {/* Security Settings */}
          <Card className="bg-black border border-white/20 rounded-2xl p-5">
            <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Security Settings
            </h3>
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full border-border text-foreground"
                onClick={() => setShowPasswordDialog(true)}
              >
                Change Password
              </Button>
              <Button
                variant="outline"
                className="w-full bg-black border border-white/20 rounded-xl py-3 text-white hover:border-white/40 transition-all"
                disabled
              >
                Enable Two-Factor Authentication (Coming soon)
              </Button>
              <Button
                variant="outline"
                className="w-full bg-black border border-white/10 rounded-xl py-3 text-white/40 cursor-not-allowed"
                disabled
              >
                View Login Activity (Coming soon)
              </Button>
            </div>
          </Card>

          {/* Data Control */}
          <Card className="bg-black border border-white/20 rounded-2xl p-5 opacity-60">
            <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Data Control
<span className="text-xs text-white/50 font-normal">(Coming soon)</span>
            </h3>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full bg-black border border-white/10 rounded-xl py-3 text-white/40 cursor-not-allowed"
                disabled
              >
                Download My Data
              </Button>
              <Button
                variant="outline"
                className="w-full bg-black border border-white/10 rounded-xl py-3 text-white/40 cursor-not-allowed"
                disabled
              >
                Manage Blocked Users
              </Button>
              <Button
                variant="outline"
                className="w-full bg-black border border-white/10 rounded-xl py-3 text-white/40 cursor-not-allowed"
                disabled
              >
                Clear Search History
              </Button>
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="bg-black border border-white/20 rounded-2xl p-5 opacity-60">
            <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Danger Zone
              <span className="text-xs text-white/50 font-normal">(Coming soon)</span>
            </h3>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full bg-black border border-white/10 rounded-xl py-3 text-white/40 cursor-not-allowed"
                disabled
              >
                Deactivate Account
              </Button>
              <Button
                variant="outline"
                className="w-full bg-black border border-white/10 rounded-xl py-3 text-white/40 cursor-not-allowed"
                disabled
              >
                Delete Account
              </Button>
            </div>
            <p className="text-xs text-white/50 mt-2">
              Account management features are coming soon.
            </p>
          </Card>
        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Change Password</DialogTitle>
            <DialogDescription className="text-white/50">
              Enter your new password below. Must be at least 6 characters.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-foreground">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-input border-border text-foreground"
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-foreground">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-input border-border text-foreground"
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordDialog(false);
                setNewPassword("");
                setConfirmPassword("");
              }}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="btn-primary"
            >
              {changingPassword ? "Updating..." : "Update Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrivacySecurity;