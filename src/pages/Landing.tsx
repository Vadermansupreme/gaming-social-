import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Users, MapPin, MessageCircle, Star, CheckCircle } from "lucide-react";
import spotmeLogo from "@/assets/spotme-logo-new.png";

const Landing = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      }
    };
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);


  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-background/95 backdrop-blur-sm border-b border-border z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={spotmeLogo} alt="SpotMe" className="w-10 h-10" />
          <span className="text-xl font-bold text-foreground tracking-tight select-none ml-1">SpotMe</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/about")} className="hidden md:inline-flex">
              About
            </Button>
            <Button variant="ghost" onClick={() => navigate("/contact")} className="hidden md:inline-flex">
              Contact
            </Button>
            {user ? (
              <Button onClick={() => navigate("/app")} className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-end))] text-primary-foreground">
                Go to App
              </Button>
            ) : (
              <Button variant="outline" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="container mx-auto text-center">
          <div className="flex justify-center mb-8">
            <img src={spotmeLogo} alt="SpotMe" className="w-24 h-24" />
          </div>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-end))] bg-clip-text text-transparent">
            Find your fitness partner, anytime, anywhere
          </h1>
          <p className="text-xl text-white mb-6 max-w-2xl mx-auto">
            Connect with nearby workout partners, get spotted safely during lifts, and build a fitness community through messaging and social posts.
          </p>
          <p className="text-sm text-white mb-8">
            Invite-only beta. You'll need an invite link to create an account.
          </p>
          <Button 
            size="lg" 
            asChild
            className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-end))] text-primary-foreground text-lg px-8 py-6 h-auto"
          >
            <a href="https://waitlist.spotmeappworldwide.com" target="_blank" rel="noopener noreferrer">
              Request Invite
            </a>
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-card/30">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose SpotMe?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-card border-border text-center p-6">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-end))] flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold">Find Spotters</h3>
                <p className="text-white">Connect with nearby fitness enthusiasts based on your goals and schedule.</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border text-center p-6">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-end))] flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold">Discover Gyms</h3>
                <p className="text-white">Find gyms with amenities you need and purchase day passes instantly.</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border text-center p-6">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-end))] flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold">Stay Connected</h3>
                <p className="text-white">Message other users and share your fitness journey on the social feed.</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border text-center p-6">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-end))] flex items-center justify-center">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold">Build Community</h3>
                <p className="text-white">Rate experiences, leave reviews, and build trust within the community.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-8">Perfect for Every Fitness Level</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-[hsl(var(--goal-green))] mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">Beginners Welcome</h3>
                    <p className="text-white">Find experienced partners who can help you learn proper form and technique.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-[hsl(var(--goal-green))] mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">Safe Spotting</h3>
                    <p className="text-white">Never worry about lifting heavy weights alone. Get spotted safely by verified users.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-[hsl(var(--goal-green))] mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">Motivation & Accountability</h3>
                    <p className="text-white">Stay motivated with workout partners who share your goals and schedule.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Badge className="bg-chip-goal text-center p-4 text-lg font-semibold">
                Build Muscle
              </Badge>
              <Badge className="bg-chip-availability text-center p-4 text-lg font-semibold text-black">
                Lose Weight
              </Badge>
              <Badge className="bg-primary/20 text-primary text-center p-4 text-lg font-semibold">
                Improve Form
              </Badge>
              <Badge className="bg-secondary text-secondary-foreground text-center p-4 text-lg font-semibold">
                Flexibility
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-end))] text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Fitness Journey?</h2>
          <p className="text-xl mb-8 opacity-90">Join our invite-only beta and be among the first to experience SpotMe</p>
          <Button 
            size="lg" 
            asChild
            className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 h-auto"
          >
            <a href="https://waitlist.spotmeappworldwide.com" target="_blank" rel="noopener noreferrer">
              Request Your Invite
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-card border-t border-border">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Business Info */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={spotmeLogo} alt="SpotMe" className="w-8 h-8" />
                <span className="text-xl font-bold text-foreground tracking-tight select-none ml-1">SpotMe</span>
              </div>
              <p className="text-sm text-white mb-4">
                Find your fitness partner, anytime, anywhere.
              </p>
              <div className="text-sm text-white">
                <p className="font-semibold text-foreground mb-1">SpotMe Worldwide LLC</p>
                <p>Columbia Pike</p>
                <p>Arlington, VA 22204</p>
                <p>United States</p>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <div className="space-y-2 text-sm">
                <a href="/about" className="block text-white hover:text-foreground transition-colors">
                  About Us
                </a>
                <a href="/updates" className="block text-white hover:text-foreground transition-colors">
                  What's New
                </a>
                <a href="/contact" className="block text-white hover:text-foreground transition-colors">
                  Contact
                </a>
                <a href="https://waitlist.spotmeappworldwide.com" target="_blank" rel="noopener noreferrer" className="block text-white hover:text-foreground transition-colors">
                  Join Waitlist
                </a>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <div className="space-y-2 text-sm text-white">
                <p className="flex items-center gap-2">
                  <span>Email:</span>
                  <a href="mailto:info@spotmeappworldwide.com" className="hover:text-foreground transition-colors">
                    info@spotmeappworldwide.com
                  </a>
                </p>
              </div>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <div className="space-y-2 text-sm">
                <a href="/privacy" className="block text-white hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
                <a href="/terms" className="block text-white hover:text-foreground transition-colors">
                  Terms of Service
                </a>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border text-center text-sm text-white">
            <p>© {new Date().getFullYear()} SpotMe Worldwide LLC. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;