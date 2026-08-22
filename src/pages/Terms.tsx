import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Dumbbell } from "lucide-react";

const Terms = () => {
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
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Agreement to Terms</h2>
            <p className="text-white">
              By accessing or using SpotMe, you agree to be bound by these Terms of Service and all applicable laws and 
              regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">User Accounts</h2>
            <p className="text-white mb-3">To use SpotMe, you must:</p>
            <ul className="list-disc pl-6 text-white space-y-2">
              <li>Be at least 18 years of age</li>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">User Conduct</h2>
            <p className="text-white mb-3">You agree not to:</p>
            <ul className="list-disc pl-6 text-white space-y-2">
              <li>Harass, abuse, or harm other users</li>
              <li>Post false, misleading, or inappropriate content</li>
              <li>Use the service for any illegal purposes</li>
              <li>Impersonate others or misrepresent your identity</li>
              <li>Attempt to gain unauthorized access to the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Safety and Liability</h2>
            <p className="text-white">
              SpotMe is a platform to connect fitness enthusiasts. Users are responsible for their own safety when meeting 
              or training with others. We recommend meeting in public places and following safety guidelines. SpotMe is not 
              liable for injuries, accidents, or incidents that occur during workouts or meetings arranged through the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Content Ownership</h2>
            <p className="text-white">
              You retain ownership of content you post on SpotMe. By posting content, you grant us a license to use, 
              display, and distribute that content within the platform. We reserve the right to remove content that 
              violates these terms or our community guidelines.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Termination</h2>
            <p className="text-white">
              We reserve the right to terminate or suspend your account at any time for violations of these Terms of Service 
              or for any other reason at our sole discretion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Modifications</h2>
            <p className="text-white">
              We may revise these Terms of Service at any time. Continued use of the platform after changes constitutes 
              acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
            <p className="text-white">
              For questions about these Terms of Service, please contact us at:
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

export default Terms;
