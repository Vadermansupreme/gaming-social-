import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Users, Target, Heart, Shield } from "lucide-react";
import spotmeLogo from "@/assets/spotme-logo-new.png";

const About = () => {
  const navigate = useNavigate();

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
        {/* Hero Section */}
        <div className="text-center mb-12">
          <img src={spotmeLogo} alt="SpotMe" className="w-20 h-20 mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4">About SpotMe</h1>
          <p className="text-xl text-white max-w-2xl mx-auto">
            We're building the world's most connected fitness community, one workout at a time.
          </p>
        </div>

        {/* Mission */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-center">Our Mission</h2>
          <Card className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-end))] text-white border-0">
            <CardContent className="p-8 text-center">
              <p className="text-lg leading-relaxed">
                SpotMe exists to solve the problem of working out alone. We believe fitness is better together—whether you need a spotter for heavy lifts, motivation to stay consistent, or simply someone who shares your goals. Our mission is to connect fitness enthusiasts worldwide, making every workout safer, more enjoyable, and more effective.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* What We Do */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-center">What We Do</h2>
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p className="text-white text-lg leading-relaxed mb-4">
              SpotMe is a social fitness and accountability app that helps users connect with nearby workout partners ("Spotters") and discover gyms. Through our platform, you can:
            </p>
            <ul className="space-y-3 text-white">
              <li className="flex items-start gap-2">
                <span className="text-[hsl(var(--primary))] font-bold">•</span>
                <span>Find people with similar workout goals and fitness levels</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[hsl(var(--primary))] font-bold">•</span>
                <span>Get spotted safely during lifts and challenging exercises</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[hsl(var(--primary))] font-bold">•</span>
                <span>Increase motivation and accountability through community</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[hsl(var(--primary))] font-bold">•</span>
                <span>Discover gyms and amenities near you</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[hsl(var(--primary))] font-bold">•</span>
                <span>Build lasting fitness friendships through messaging and social posts</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Values */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-center">Our Values</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-end))] flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Community First</h3>
                <p className="text-white">
                  We believe in the power of community to transform individual fitness journeys into shared success stories.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-end))] flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Safety & Trust</h3>
                <p className="text-white">
                  Your safety is paramount. We verify users and provide tools to ensure safe, positive interactions.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-end))] flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Goal-Oriented</h3>
                <p className="text-white">
                  Whether you're building muscle or improving flexibility, we help you find partners aligned with your goals.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-end))] flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Inclusive & Welcoming</h3>
                <p className="text-white">
                  From beginners to advanced athletes, everyone deserves a supportive fitness community.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Company Info */}
        <section className="mb-12">
          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4 text-center">Who We Are</h2>
              <div className="space-y-4 text-center">
                <div>
                  <p className="font-semibold text-lg">SpotMe Worldwide LLC</p>
                  <p className="text-white">Columbia Pike, Arlington, VA 22204</p>
                  <p className="text-white">United States</p>
                </div>
                <div className="pt-4 border-t border-border">
                  <p className="text-white mb-2">Get in touch:</p>
                  <a 
                    href="mailto:info@spotmeappworldwide.com" 
                    className="text-[hsl(var(--primary))] hover:underline font-medium"
                  >
                    info@spotmeappworldwide.com
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Join the Movement?</h2>
          <p className="text-white mb-6">
            Be part of the fitness community that's changing how people work out together
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-end))] text-primary-foreground"
              asChild
            >
              <a href="https://waitlist.spotmeappworldwide.com" target="_blank" rel="noopener noreferrer">
                Join Waitlist
              </a>
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate("/contact")}
            >
              Contact Us
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default About;
