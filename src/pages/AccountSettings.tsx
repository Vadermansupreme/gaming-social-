import { useState, useEffect } from "react";
import { ArrowLeft, User, Mail, Shield, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const AccountSettings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    display_name: "",
    first_name: "",
    last_name: "",
    bio: "",
    fitness_level: "Beginner",
    vibe: "Gym Vibe"
  });

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileData) {
          setProfile(profileData);
          setFormData({
            display_name: profileData.display_name || "",
            first_name: profileData.first_name || "",
            last_name: profileData.last_name || "",
            bio: profileData.bio || "",
            fitness_level: profileData.fitness_level || "Beginner",
            vibe: profileData.vibe || "Gym Vibe"
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', user.id);

      if (error) throw error;

      toast.success("Account settings updated successfully!");
      await getCurrentUser();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Failed to update account settings");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async () => {
    if (!user) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const fileName = `${user.id}/avatar-${Date.now()}.${file.name.split('.').pop()}`;
        
        const { error: uploadError } = await supabase.storage
          .from('user-uploads')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('user-uploads')
          .getPublicUrl(fileName);

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', user.id);

        if (updateError) throw updateError;

        await getCurrentUser();
        toast.success("Profile photo updated!");
      } catch (error) {
        console.error('Error uploading avatar:', error);
        toast.error("Failed to upload profile photo");
      }
    };
    
    input.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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
            Account Settings
          </h1>
        </div>

        <div className="space-y-6">
          {/* Profile Photo Section */}
          <Card className="bg-black border border-white/20 rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-20 h-20 avatar-ring">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-end))] text-white font-bold text-xl">
                    {formData.display_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full"
                  onClick={handleAvatarUpload}
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Profile Photo</h3>
                <p className="text-sm text-white">Update your profile picture</p>
              </div>
            </div>
          </Card>

          {/* Basic Information */}
          <Card className="bg-black border border-white/20 rounded-2xl p-5">
            <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
              <User className="w-5 h-5" />
              Basic Information
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="display_name" className="text-secondary">Display Name</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                  className="!bg-black !border-white/30 !text-white rounded-xl placeholder:text-white/40 focus-visible:ring-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name" className="text-secondary">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    className="!bg-black !border-white/30 !text-white rounded-xl placeholder:text-white/40 focus-visible:ring-emerald-500"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name" className="text-secondary">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                    className="!bg-black !border-white/30 !text-white rounded-xl placeholder:text-white/40 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="bio" className="text-secondary">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  className="!bg-black !border-white/30 !text-white rounded-xl placeholder:text-white/40 focus-visible:ring-emerald-500"
                  rows={3}
                  placeholder="Tell others about yourself..."
                />
              </div>
            </div>
          </Card>

          {/* Contact Information */}
          <Card className="bg-black border border-white/20 rounded-2xl p-5">
            <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Contact Information
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-secondary">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="!bg-black !border-white/30 !text-white rounded-xl placeholder:text-white/40 focus-visible:ring-emerald-500"
                />
                <p className="text-xs text-white mt-1">Email cannot be changed here</p>
              </div>
            </div>
          </Card>

          

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold border border-emerald-300"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;