import { ArrowLeft } from "lucide-react";
import spotmeLogo from "@/assets/spotme-logo-new.png";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const AboutSpotMe = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">About SpotMe</h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Logo and Tagline */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-end))] rounded-full flex items-center justify-center">
            <img 
              src={spotmeLogo} 
              alt="SpotMe Logo"
              className="w-12 h-12 object-contain"
              onError={(e) => {
                // Fallback to text logo if image fails
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-2xl font-bold text-white">SM</span>';
              }}
            />
          </div>
          <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-end))] bg-clip-text text-transparent">
            SpotMe
          </h2>
          <p className="text-lg text-white">
            Find your fitness partner, anytime, anywhere.
          </p>
        </div>

        {/* Mission */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Our Mission</h3>
          <p className="text-white leading-relaxed">
            SpotMe is a social fitness and accountability app that helps users connect with nearby workout partners ("Spotters") and discover gyms. We solve the problem of working out alone by providing community, safety, and motivation.
          </p>
        </Card>

        {/* Core Values */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Core Values</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-medium mb-1">Find Your People</h4>
                <p className="text-sm text-white">Connect with users who share similar workout goals and fitness levels.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-medium mb-1">Safety First</h4>
                <p className="text-sm text-white">Get spotted safely during lifts and exercises with trusted partners.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-medium mb-1">Stay Motivated</h4>
                <p className="text-sm text-white">Increase motivation and accountability through community support.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-medium mb-1">Discover Places</h4>
                <p className="text-sm text-white">Find gyms, parks, and fitness amenities near you.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-medium mb-1">Build Community</h4>
                <p className="text-sm text-white">Create lasting fitness friendships through messaging and social sharing.</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Features */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Key Features</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-end))] rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">✓</span>
              </div>
              <span className="text-sm">Browse nearby workout partners</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-end))] rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">✓</span>
              </div>
              <span className="text-sm">Match based on goals and schedules</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-end))] rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">✓</span>
              </div>
              <span className="text-sm">In-app messaging and social feed</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-end))] rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">✓</span>
              </div>
              <span className="text-sm">Discover gyms and fitness locations</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-end))] rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">✓</span>
              </div>
              <span className="text-sm">Safe and verified user profiles</span>
            </div>
          </div>
        </Card>

        {/* Contact */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Get in Touch</h3>
          <p className="text-white text-sm mb-4">
            Have questions, feedback, or suggestions? We'd love to hear from you!
          </p>
          <div className="space-y-2 text-sm">
            <p className="font-semibold">SpotMe Worldwide LLC</p>
            <p className="text-white">Columbia Pike</p>
            <p className="text-white">Arlington, VA 22204</p>
            <p className="text-white">United States</p>
            <p className="text-white mt-2">
              Email: <a href="mailto:info@spotmeappworldwide.com" className="text-[hsl(var(--primary))] hover:underline">info@spotmeappworldwide.com</a>
            </p>
          </div>
        </Card>

        {/* Version */}
        <div className="text-center text-xs text-white">
          SpotMe v1.0.0 • Made with ❤️ for the fitness community
        </div>
      </div>
    </div>
  );
};

export default AboutSpotMe;
