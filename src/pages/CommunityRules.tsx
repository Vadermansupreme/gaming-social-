import { ArrowLeft, Heart, MessageSquare, Ban, ThumbsUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const CommunityRules = () => {
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
            Community Rules
          </h1>
        </div>

        <div className="space-y-6">
          <Card className="bg-card border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-6 h-6 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Our Community Values</h2>
            </div>
            <p className="text-white">
              SpotMe is built on mutual respect, encouragement, and a shared love of fitness. 
              These rules help maintain a positive environment for everyone.
            </p>
          </Card>

          <Card className="bg-card border-border p-6">
            <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-primary" />
              Do's
            </h3>
            <ul className="space-y-3 text-white">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Be respectful and supportive of all fitness levels</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Honor your workout commitments and communicate changes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Share genuine, helpful fitness content</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Encourage and motivate fellow SpotMe members</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Report inappropriate behavior to keep our community safe</span>
              </li>
            </ul>
          </Card>

          <Card className="bg-card border-border p-6">
            <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
              <Ban className="w-5 h-5 text-destructive" />
              Don'ts
            </h3>
            <ul className="space-y-3 text-white">
              <li className="flex items-start gap-2">
                <span className="text-destructive">✗</span>
                <span>Harassment, bullying, or discrimination of any kind</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive">✗</span>
                <span>Spam, self-promotion, or misleading content</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive">✗</span>
                <span>Sharing inappropriate or explicit content</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive">✗</span>
                <span>Impersonating others or creating fake profiles</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive">✗</span>
                <span>Soliciting personal information or money</span>
              </li>
            </ul>
          </Card>

          <Card className="bg-card border-border p-6">
            <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Consequences
            </h3>
            <p className="text-white">
              Violations of community rules may result in warnings, temporary suspension, 
              or permanent removal from SpotMe. We review all reports and take appropriate action 
              to maintain a safe and welcoming community.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CommunityRules;
