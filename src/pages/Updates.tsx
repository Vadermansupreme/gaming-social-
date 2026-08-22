import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Rocket, Calendar } from "lucide-react";
import spotmeLogo from "@/assets/spotme-logo-new.png";

const Updates = () => {
  const navigate = useNavigate();

  const updates = [
    {
      date: "October 2025",
      title: "Platform Launch Preparation",
      badge: "Coming Soon",
      items: [
        "Final beta testing with select users",
        "Gym partnership program rollout",
        "Enhanced matching algorithm improvements",
        "Real-time chat feature optimization"
      ]
    },
    {
      date: "November 2025",
      title: "Official Launch",
      badge: "Upcoming",
      items: [
        "Public release on iOS and Android",
        "Web app fully functional",
        "Launch marketing campaign",
        "Onboarding of first 1,000 users"
      ]
    }
  ];

  const roadmap = [
    {
      title: "Smart Workout Suggestions",
      description: "AI-powered recommendations for workout partners based on your goals and history",
      status: "In Development"
    },
    {
      title: "Group Training Sessions",
      description: "Create and join group workouts with multiple spotters",
      status: "Planned"
    },
    {
      title: "Verified Trainer Profiles",
      description: "Connect with certified personal trainers for professional guidance",
      status: "Planned"
    },
    {
      title: "Wearable Integration",
      description: "Sync with Apple Watch, Fitbit, and other fitness trackers",
      status: "Research Phase"
    },
    {
      title: "Video Spotting",
      description: "Get remote spotting assistance through video calls",
      status: "Research Phase"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={spotmeLogo} alt="SpotMe" className="w-10 h-10" />
            <span className="text-xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-end))] bg-clip-text text-transparent">
              SpotMe
            </span>
          </div>
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">What's New</h1>
          <p className="text-xl text-white">
            Stay updated on the latest features and upcoming releases
          </p>
        </div>

        {/* Recent Updates */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Recent Updates</h2>
          <div className="space-y-6">
            {updates.map((update, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-white" />
                        <span className="text-sm text-white">{update.date}</span>
                      </div>
                      <CardTitle>{update.title}</CardTitle>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-end))] text-white"
                    >
                      {update.badge}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {update.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[hsl(var(--primary))] mt-1">•</span>
                        <span className="text-white">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Roadmap */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Rocket className="w-6 h-6 text-[hsl(var(--primary))]" />
            <h2 className="text-2xl font-bold">Feature Roadmap</h2>
          </div>
          <div className="space-y-4">
            {roadmap.map((feature, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </div>
                    <Badge variant="outline" className="ml-4 shrink-0">
                      {feature.status}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <Card className="mt-12 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-end))] text-white border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Want to Stay Updated?</CardTitle>
            <CardDescription className="text-white/90">
              Join our waitlist to get early access and updates
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button 
              size="lg"
              className="bg-white text-primary hover:bg-white/90"
              asChild
            >
              <a href="https://waitlist.spotmeappworldwide.com" target="_blank" rel="noopener noreferrer">
                Join Waitlist
              </a>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Updates;
