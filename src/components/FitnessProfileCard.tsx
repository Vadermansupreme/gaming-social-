import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Target, Dumbbell, Star } from "lucide-react";

type FitnessProfile = {
  fitness_level?: string | null;
  vibe?: string | null;
  fitness_goals?: string[] | null;
  preferred_workouts?: string[] | null;
  home_gym_place_id?: string | null;
};

interface FitnessProfileCardProps {
  profile: FitnessProfile;
}

const FitnessProfileCard = ({ profile }: FitnessProfileCardProps) => {
  return (
    <Card className="p-6 border-white/20">
      <h3 className="text-lg font-semibold mb-4">Fitness Profile</h3>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Star className="w-5 h-5 text-orange-500" />
          <div>
            <p className="text-sm font-medium">Experience Level</p>
            <p className="text-sm text-white">
              {profile.fitness_level || "Not specified"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Dumbbell className="w-5 h-5 text-green-500" />
          <div>
            <p className="text-sm font-medium">Gym Vibe</p>
            <p className="text-sm text-white">
              {profile.vibe || "Not specified"}
            </p>
          </div>
        </div>

        {profile.fitness_goals && profile.fitness_goals.length > 0 && (
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium mb-2">Goals</p>
              <div className="flex flex-wrap gap-2">
                {profile.fitness_goals.map((goal, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {goal}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {profile.preferred_workouts && profile.preferred_workouts.length > 0 && (
          <div className="flex items-start gap-3">
            <Dumbbell className="w-5 h-5 text-purple-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium mb-2">Preferred Workouts</p>
              <div className="flex flex-wrap gap-2">
                {profile.preferred_workouts.map((workout, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {workout}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {profile.home_gym_place_id && (
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm font-medium">Home Gym</p>
              <p className="text-sm text-white">Linked gym location</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default FitnessProfileCard;

