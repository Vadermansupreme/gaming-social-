import { useState, useEffect } from "react";
import { ArrowLeft, Camera, User, Target, Dumbbell, Calendar, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const vibeMeta: Record<string, { label: string; color: string }> = {
  CASUAL: { label: "Casual", color: "#9CA3AF" },
  ROUTINE: { label: "Routine", color: "#3B82F6" },
  DRIVEN: { label: "Driven", color: "#10B981" },
  COMPETITOR: { label: "Competitor", color: "#F97316" },
  APEX: { label: "Apex", color: "#EF4444" },
};
const EditProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [spotQuery, setSpotQuery] = useState("");
const [spotResults, setSpotResults] = useState<any[]>([]);
const [spotLoading, setSpotLoading] = useState(false);
const [showSpotResults, setShowSpotResults] = useState(false);
const [userPostPhotos, setUserPostPhotos] = useState<any[]>([]);
const [loadingPostPhotos, setLoadingPostPhotos] = useState(false);
  const [formData, setFormData] = useState({
    display_name: "",
    bio: "",
    vibe: "Casual" as string,
    my_spots: [],
    
  });
const currentVibe = vibeMeta[formData.vibe] || vibeMeta.CASUAL;


  useEffect(() => {
  if (user) {
    fetchProfile();
    loadUserPostPhotos();
  }
}, [user]);

useEffect(() => {
  const timeout = setTimeout(() => {
    searchSpots(spotQuery);
  }, 250);

  return () => clearTimeout(timeout);
}, [spotQuery]);
const loadUserPostPhotos = async () => {
  if (!user?.id) return;

  setLoadingPostPhotos(true);

  const { data, error } = await supabase
  .from("posts" as any)
  .select("*")
  .eq("author_id", user.id);

if (!error && data) {
  const flattenedPhotos = (data || []).flatMap((post: any) =>
    (post.media_urls || []).map((url: string, index: number) => ({
      id: `${post.id}-${index}`,
      postId: post.id,
      image_url: url,
    }))
  );

  setUserPostPhotos(flattenedPhotos);
}

  setLoadingPostPhotos(false);
};
  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      
      if (profileData) {
        setProfile(profileData);
        setFormData({
  display_name: profileData.display_name || "",
bio: profileData.bio || "",
vibe: profileData.vibe || "Casual",
my_spots: (profileData as any).preferred_workouts || [],
});
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };



  const searchSpots = async (query: string) => {
  if (!query.trim()) {
    setSpotResults([]);
    return;
  }

  setSpotLoading(true);

  try {
    const { data: profileMatches } = await supabase
      .from("profiles")
      .select("id, display_name")
      .ilike("display_name", `%${query}%`)
      .limit(5);

    const { data: placeMatches } = await supabase
  .from("gyms")
  .select("id, name")
  .ilike("name", `%${query}%`)
  .limit(5);
const {
  data: { session },
} = await supabase.auth.getSession();

const googleResults = await fetch(
  "https://jtfmswgrhnjdunghqygf.supabase.co/functions/v1/places/autocomplete?q=" +
    encodeURIComponent(query),
  {
    headers: {
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
  }
).then(async (res) => {
  if (!res.ok) {
    console.error("API ERROR:", await res.text());
    return [];
  }
  return res.json();
});
 console.log("googleResults:", googleResults);
 console.log("googleResults keys:", Object.keys(googleResults || {}));
console.log("googleResults full:", JSON.stringify(googleResults, null, 2));

    const formattedProfiles = (profileMatches || []).map((user) => ({
      id: user.id,
      label: user.display_name,
      sublabel: "User",
      type: "person",
    }));

    const formattedPlaces = (placeMatches || []).map((place) => ({
      id: place.id,
      label: place.name,
      sublabel: "Place",
      type: "place",
    }));
const safeGoogleResults = Array.isArray(googleResults?.items)
  ? googleResults.items
  : Array.isArray(googleResults?.results)
  ? googleResults.results
  : Array.isArray(googleResults)
  ? googleResults
  : [];

const formattedGoogle = safeGoogleResults.map((place: any) => ({
  id:
    place.place_id ||
    place.id ||
    place.placeId ||
    place.google_place_id ||
    crypto.randomUUID(),
  label:
    place.name ||
    place.title ||
    place.display_name ||
    place.displayName ||
    place.text ||
    place.main_text ||
    place.structured_formatting?.main_text ||
    "Gym",
  sublabel:
    place.vicinity ||
    place.address ||
    place.secondary_text ||
    place.structured_formatting?.secondary_text ||
    "Gym",
  type: "place",
}));
    setSpotResults([
  ...formattedGoogle,
  ...formattedPlaces,
  ...formattedProfiles,
]);
  } catch (error) {
    console.error("Error searching spots:", error);
  } finally {
    setSpotLoading(false);
  }
};
  const handleSave = async () => {
    if (!user) {
      toast.error("Please log in to save your profile");
      return;
    }
    
    console.log('Saving profile with data:', formData);
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', user.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      navigate('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async () => {
    if (!user || uploading) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        const fileName = `${user.id}/avatar-${Date.now()}.${file.name.split('.').pop()}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', user.id);

        if (updateError) throw updateError;

        await fetchProfile();
        toast.success("Profile photo updated!");
      } catch (error) {
        console.error('Error uploading avatar:', error);
        toast.error("Failed to upload profile photo");
      } finally {
        setUploading(false);
      }
    };
    
    input.click();
  };

  const handleCoverUpload = async () => {
    if (!user || uploading) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        const fileName = `${user.id}/cover-${Date.now()}.${file.name.split('.').pop()}`;
        
        const { error: uploadError } = await supabase.storage
          .from('covers')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('covers')
          .getPublicUrl(fileName);

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ cover_image_url: publicUrl })
          .eq('id', user.id);

        if (updateError) throw updateError;

        await fetchProfile();
        toast.success("Cover photo updated!");
      } catch (error) {
        console.error('Error uploading cover photo:', error);
        toast.error("Failed to upload cover photo");
      } finally {
        setUploading(false);
      }
    };
    
    input.click();
  };

  const toggleSelection = (array: string[], value: string, setter: (arr: string[]) => void) => {
    if (array.includes(value)) {
      setter(array.filter(item => item !== value));
    } else {
      setter([...array, value]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <p className="text-white mb-4">Please log in to edit your profile</p>
          <Button onClick={() => navigate('/auth')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="pt-4 pb-20">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/profile')}
            className="text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Edit Profile</h1>
        </div>

        <div className="space-y-4">
          {/* Cover Photo */}
          <Card className="relative overflow-hidden">
            <div 
              className="h-32 bg-gradient-to-r from-primary/20 to-primary/10 cursor-pointer relative group"
              onClick={handleCoverUpload}
            >
              {profile?.cover_image_url && (
                <img 
                  src={profile.cover_image_url} 
                  alt="Cover" 
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="text-white text-center">
                  <Camera className="w-6 h-6 mx-auto mb-1" />
                  <span className="text-sm">Change Cover Photo</span>
                </div>
              </div>
            </div>
            
            {/* Upload Cover Button */}
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleCoverUpload}
              disabled={uploading}
            >
              <Camera className="w-4 h-4 mr-1" />
              Cover
            </Button>
          </Card>

          {/* Profile Photo Section */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-white">
              <User className="w-5 h-5" />
              Profile Photo
            </h3>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Avatar className="w-20 h-20 shrink-0">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xl">
                  {formData.display_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-sm text-white mb-3">
                  Upload a profile picture to help other users recognize you
                </p>
                <Button
                  variant="outline"
                  onClick={handleAvatarUpload}
                  disabled={uploading}
                  className="w-full sm:w-auto"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload Photo'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Basic Information */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-white">
              <User className="w-5 h-5" />
              Basic Information
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="display_name" className="text-white">
  Display Name
</Label>
                <Input
  id="display_name"
  value={formData.display_name}
  onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
  placeholder="Enter your display name"
  className="
  focus:border-emerald-500
  focus-visible:border-emerald-500
  focus-visible:ring-0
"
/>
              </div>
              <div>
                <Label htmlFor="bio" className="text-white">
  Bio
</Label>
                <Textarea
  id="bio"
  value={formData.bio}
  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
  rows={3}
  placeholder="Tell others about yourself..."
  className="
  focus:border-emerald-500
  focus-visible:border-emerald-500
  focus-visible:ring-0
"
/>
              </div>
            </div>
          </Card>

{/* Your Vibe */}
<Card className="p-6">
  <div className="flex items-center justify-between gap-4 flex-wrap">
    <div>
      <h3 className="font-semibold text-lg text-white">
  Your Vibe
</h3>
      <p className="text-sm text-white mt-1">
        This is how you show up
      </p>
    </div>

    <div
  onClick={() => navigate("/onboarding")}
  className="px-4 py-2 rounded-full text-sm font-semibold cursor-pointer transition-all hover:scale-105"
  style={{
    backgroundColor: currentVibe.color,
    color: "#fff",
  }}
>
  {currentVibe.label}
</div>
  </div>
</Card>
  

                {/* My Spots */}
      <Card className="p-6">
        <h3 className="font-semibold mb-2 flex items-center gap-2 !text-white">
          <MapPin className="w-5 h-5 text-white" />
          My Spots
        </h3>

        <p className="text-sm text-white mb-4">
          Your favorite places and people
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {(formData.my_spots && formData.my_spots.length > 0) ? (
            formData.my_spots.map((spot) => (
              <Badge
                key={spot}
                variant="outline"
                className="cursor-pointer text-white border-white/60 bg-white/5"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    my_spots: prev.my_spots.filter((item) => item !== spot),
                  }))
                }
              >
                {spot}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-white">
              No spots added yet
            </p>
          )}
        </div>
<Input
  value={spotQuery}
  onChange={(e) => {
    setSpotQuery(e.target.value);
    setShowSpotResults(true);
  }}
  placeholder="Add a favorite place or person"
  className="
    bg-white/[0.02]
    text-white
    border-white/20
    placeholder:text-white/50
    focus:border-emerald-500
focus:ring-0
focus-visible:ring-0
focus-visible:ring-offset-0
focus-visible:border-emerald-500
  "
/>
        {showSpotResults && spotResults.length > 0 && (
  <div className="mt-2 bg-black border rounded-lg">
    {spotResults.map((item) => (
      <div
        key={item.id}
        className="p-3 border-b last:border-none cursor-pointer hover:bg-gray-800"
        onClick={() => {
          setFormData((prev) => ({
            ...prev,
            my_spots: [...prev.my_spots, item.label],
          }));

          setSpotQuery("");
          setShowSpotResults(false);
        }}
      >
        <div className="font-medium text-white">{item.label}</div>
        <div className="text-xs text-gray-400">{item.sublabel}</div>
      </div>
    ))}
  </div>
)}
      </Card>

          
<Card className="bg-zinc-900 border-zinc-800">
  <CardContent className="p-4">
    <h3 className="text-white text-lg font-semibold mb-3">Edit Photos</h3>

    {loadingPostPhotos ? (
      <p className="text-sm text-zinc-400">Loading photos...</p>
    ) : userPostPhotos.length === 0 ? (
      <p className="text-sm text-zinc-400">No post photos yet.</p>
    ) : (
      <div className="grid grid-cols-3 gap-3">
        {userPostPhotos.map((post: any) => (
          <div
            key={post.id}
            className="aspect-square overflow-hidden rounded-xl bg-zinc-800"
          >
            <img
              src={post.image_url}
              alt="Post photo"
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
    )}
  </CardContent>
</Card>
          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving || uploading}
            className="w-full"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;