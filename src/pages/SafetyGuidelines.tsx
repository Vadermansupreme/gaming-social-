import { ArrowLeft, Shield, Users, AlertTriangle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const SafetyGuidelines = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-background min-h-screen">
      <div className="px-4 pt-6 pb-6">
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
            Safety Guidelines
          </h1>
        </div>

        <div className="space-y-6">
          <Card className="bg-card border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Your Safety Matters</h2>
            </div>
            <p className="text-white">
              At SpotMe, we prioritize creating a safe environment for all fitness enthusiasts. 
              Follow these guidelines to ensure positive workout experiences.
            </p>
          </Card>

          <Card className="bg-card border-border p-6">
            <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Meeting Workout Partners
            </h3>
            <ul className="space-y-3 text-white">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>Always meet in public gym facilities for your first few sessions</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>Let a friend or family member know your workout plans</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>Check reviews and verification badges before connecting</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>Trust your instincts—if something feels off, leave</span>
              </li>
            </ul>
          </Card>

          <Card className="bg-card border-border p-6">
            <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Red Flags to Watch For
            </h3>
            <ul className="space-y-3 text-white">
              <li className="flex items-start gap-2">
                <span className="text-orange-500">•</span>
                <span>Requests to meet at private locations for first sessions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500">•</span>
                <span>Pressure to share personal information quickly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500">•</span>
                <span>Unwillingness to verify identity or show gym membership</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500">•</span>
                <span>Inappropriate or uncomfortable messages</span>
              </li>
            </ul>
          </Card>

          <Card className="bg-card border-border p-6">
            <h3 className="font-semibold mb-4 text-foreground">Report Concerns</h3>
            <p className="text-white mb-4">
              If you experience or witness any unsafe behavior, please report it immediately. 
              We take all reports seriously and will investigate promptly.
            </p>
            <Button 
              variant="outline" 
              className="w-full border-border"
              onClick={() => navigate('/help-support')}
            >
              Contact Support
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SafetyGuidelines;
