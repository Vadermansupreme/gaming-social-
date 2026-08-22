import { useState, useEffect, memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Check, X, User, Palette, MapPin, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface OnboardingChecklistProps {
  userId: string;
  profile: any;
}

interface ChecklistItem {
  id: string;
  label: string;
  icon: any;
  completed: boolean;
  action: () => void;
}

const OnboardingChecklist = memo(({ userId, profile }: OnboardingChecklistProps) => {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const [hasMessages, setHasMessages] = useState<boolean | null>(null);
  const [hasGymSearch, setHasGymSearch] = useState<boolean | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Early exit if already completed - prevents any flash
  const alreadyCompleted = profile?.onboarding_completed === true;

  useEffect(() => {
    if (alreadyCompleted) return;
    checkProgress();
  }, [userId, alreadyCompleted]);

  const checkProgress = async () => {
    try {
      const [messagesResult, favoritesResult] = await Promise.all([
        supabase
          .from('messages')
          .select('id')
          .eq('sender_id', userId)
          .limit(1),
        supabase
          .from('gym_favorites')
          .select('place_id')
          .eq('user_id', userId)
          .limit(1)
      ]);

      setHasMessages((messagesResult.data?.length || 0) > 0);
      setHasGymSearch((favoritesResult.data?.length || 0) > 0);
      setIsReady(true);
    } catch (error) {
      console.error('Error checking onboarding progress:', error);
      setIsReady(true);
    }
  };

  const items = useMemo(() => {
    if (!isReady) return [];

    const profileComplete = !!(
      profile?.display_name && 
      profile?.bio && 
      profile?.avatar_url
    );
    
    const vibeSet = !!(profile?.vibe && profile.vibe !== 'Motivated' && profile.vibe !== 'Gym Vibe');

    return [
      {
        id: 'profile',
        label: 'Complete your profile',
        icon: User,
        completed: profileComplete,
        action: () => navigate('/profile/edit'),
      },
      {
        id: 'vibe',
        label: 'Set your Gym Vibe',
        icon: Palette,
        completed: vibeSet,
        action: () => navigate('/profile/edit'),
      },
      {
        id: 'gym',
        label: 'Find a gym near you',
        icon: MapPin,
        completed: hasGymSearch === true,
        action: () => navigate('/gyms'),
      },
      {
        id: 'message',
        label: 'Send your first message',
        icon: MessageSquare,
        completed: hasMessages === true,
        action: () => navigate('/messages'),
      },
    ];
  }, [profile, hasMessages, hasGymSearch, isReady, navigate]);

  const completedCount = useMemo(() => items.filter(item => item.completed).length, [items]);
  const allCompleted = completedCount === items.length && items.length > 0;

  // Don't render anything if: already completed, all items done, dismissed, or not ready
  if (alreadyCompleted || dismissed || !isReady) {
    return null;
  }

  // Mark as complete and hide if all done
  if (allCompleted) {
    supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', userId)
      .then(() => {});
    return null;
  }

  const handleDismiss = async () => {
    setDismissed(true);
    await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', userId);
  };

  return (
    <div className="mx-4 mb-4 p-4 bg-card border border-border rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm">Get started with SpotMe</h3>
          <p className="text-xs text-white">{completedCount}/{items.length} completed</p>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleDismiss}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={item.action}
            className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
              item.completed 
                ? 'bg-muted/50' 
                : 'hover:bg-muted/50'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              item.completed 
                ? 'bg-green-500 text-white' 
                : 'bg-muted'
            }`}>
              {item.completed ? (
                <Check className="w-3 h-3" />
              ) : (
                <item.icon className="w-3 h-3 text-white" />
              )}
            </div>
            <span className={`text-sm ${item.completed ? 'text-white line-through' : ''}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
});

OnboardingChecklist.displayName = 'OnboardingChecklist';

export { OnboardingChecklist };
export default OnboardingChecklist;
