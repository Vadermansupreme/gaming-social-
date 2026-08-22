import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Dumbbell } from "lucide-react";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-end))] flex items-center justify-center border-2 border-[hsl(var(--brand-ring-outer))]">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
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
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
            <p className="text-white">
              SpotMe ("we," "our," or "us") respects your privacy and is committed to protecting your personal information. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 
              mobile application and services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
            <p className="text-white mb-3">We collect information that you provide directly to us, including:</p>
            <ul className="list-disc pl-6 text-white space-y-2">
              <li>Account information (name, email address, profile photo)</li>
              <li>Profile details (fitness goals, experience level, availability)</li>
              <li>Location data (to help you find nearby workout partners and gyms)</li>
              <li>Messages and interactions with other users</li>
              <li>User-generated content (posts, photos, reviews)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
            <p className="text-white mb-3">We use the information we collect to:</p>
            <ul className="list-disc pl-6 text-white space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Connect you with nearby workout partners</li>
              <li>Help you discover gyms and fitness facilities</li>
              <li>Send you updates, notifications, and promotional materials</li>
              <li>Ensure safety and security of our platform</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Information Sharing</h2>
            <p className="text-white">
              We do not sell your personal information. We may share your information with other users as part of the 
              normal functionality of the app (e.g., showing your profile to potential workout partners), and with 
              service providers who help us operate our platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
            <p className="text-white mb-3">You have the right to:</p>
            <ul className="list-disc pl-6 text-white space-y-2">
              <li>Access and update your personal information</li>
              <li>Delete your account and associated data</li>
              <li>Opt-out of promotional communications</li>
              <li>Control location sharing settings</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-white">
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-card rounded-lg border border-border">
              <p className="font-semibold">SpotMe Worldwide LLC</p>
              <p className="text-white">Columbia Pike</p>
              <p className="text-white">Arlington, VA 22204</p>
              <p className="text-white">United States</p>
              <p className="text-white mt-2">
                Email: <a href="mailto:info@spotmeappworldwide.com" className="text-[hsl(var(--primary))] hover:underline">info@spotmeappworldwide.com</a>
              </p>
            </div>
          </section>

          <section>
            <p className="text-sm text-white italic">
              Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Privacy;
