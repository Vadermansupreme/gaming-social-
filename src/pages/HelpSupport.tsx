import { useState } from "react";
import { ArrowLeft, MessageCircle, Mail, Search, ChevronRight, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const SUPPORT_EMAIL = "info@spotmeappworldwide.com";

const HelpSupport = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [sending, setSending] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    subject: "",
    message: "",
    email: ""
  });

  const faqItems = [
    {
      question: "How do I find workout partners near me?",
      answer: "Go to the Search tab and browse through nearby users. You can filter by workout type, experience level, and availability. Use the 'Spot Me!' button to send a workout request."
    },
    {
      question: "How do I message other users?",
      answer: "Tap the 'Message' button on any user's profile. This will start a conversation thread that you can access from the Messages tab."
    },
    {
      question: "Can I change my fitness level and preferences?",
      answer: "Yes! Go to Settings > Account Settings to update your fitness level, workout preferences, and availability."
    },
    {
      question: "How do I post workout photos and videos?",
      answer: "Use the floating '+' button on the Home feed, or go to your Profile and tap 'Upload Photo/Video' in the relevant tab."
    },
    {
      question: "What are Spot Requests?",
      answer: "Spot Requests are invitations to work out together. When someone sends you a Spot Request, you'll get a notification and can accept or decline."
    },
    {
      question: "How do I report inappropriate behavior?",
      answer: "You can report users by going to their profile and tapping the menu button. Select 'Report User' and follow the prompts."
    },
    {
      question: "Can I use SpotMe without sharing my location?",
      answer: "Yes, but location sharing helps find nearby workout partners. You can control your location visibility in Privacy & Security settings."
    },
    {
      question: "How do I delete my account?",
      answer: "Go to Settings > Privacy & Security > Danger Zone. Note that this action cannot be undone."
    }
  ];

  const filteredFAQs = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openMailtoFallback = () => {
    const subject = encodeURIComponent(contactForm.subject || "Support Request");
    const body = encodeURIComponent(
      `Name: ${contactForm.name || "Not provided"}\nEmail: ${contactForm.email || "Not provided"}\n\nMessage:\n${contactForm.message}`
    );
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  const handleContactSubmit = async () => {
    if (!contactForm.message) {
      toast.error("Please enter a message");
      return;
    }
    if (!contactForm.email && !user) {
      toast.error("Please provide your email address");
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase
        .from('support_messages')
        .insert({
          name: contactForm.name || null,
          email: contactForm.email || user?.email || "",
          subject: contactForm.subject || null,
          message: contactForm.message,
          page: window.location.pathname,
          user_id: user?.id || null
        });

      if (error) throw error;

      toast.success("Message sent! We'll get back to you soon.");
      setContactForm({ name: "", subject: "", message: "", email: "" });
    } catch (error) {
      console.error('Error sending support message:', error);
      toast.error("Failed to send. Opening email instead...");
      openMailtoFallback();
    } finally {
      setSending(false);
    }
  };

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
            Help & Support
          </h1>
        </div>

        <div className="space-y-6">
          {/* Quick Contact Options */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-black border border-white/20 rounded-2xl text-center flex flex-col items-center justify-center min-h-[90px] opacity-60 cursor-not-allowed">
              <MessageCircle className="w-5 h-5 mb-1 text-white/50 shrink-0" />
              <p className="text-xs font-medium text-white/50 leading-tight">Live Chat</p>
              <p className="text-[10px] text-white/50 leading-tight">Coming soon</p>
            </Card>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="block">
              <Card className="bg-black border border-white/20 rounded-2xl text-center flex flex-col items-center justify-center min-h-[90px] hover:bg-accent/50 transition-colors cursor-pointer">
                <Mail className="w-5 h-5 mb-1 text-primary shrink-0" />
                <p className="text-xs font-medium text-foreground leading-tight">Email</p>
                <p className="text-[10px] text-white/50 leading-tight break-all">{SUPPORT_EMAIL}</p>
              </Card>
            </a>
          </div>

          {/* Search FAQ */}
          <Card className="bg-black border border-white/20 rounded-2xl">
            <h3 className="font-semibold mb-4 text-foreground">Search Help Articles</h3>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-white/50" />
              <Input
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-black border-white/30 text-white rounded-xl"
              />
            </div>
          </Card>

          {/* FAQ Section */}
          <Card className="bg-black border border-white/20 rounded-2xl">
            <h3 className="font-semibold mb-4 text-foreground">Frequently Asked Questions</h3>
            <Accordion type="single" collapsible className="w-full">
              {filteredFAQs.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-white/20">
                  <AccordionTrigger className="text-foreground hover:text-primary">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-white/50">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>

          {/* Quick Links */}
          <Card className="bg-black border border-white/20 rounded-2xl">
            <h3 className="font-semibold mb-4 text-foreground">Quick Links</h3>
            <div className="space-y-3">
              <Button variant="ghost" className="w-full justify-between text-foreground hover:bg-input" onClick={() => navigate('/about')}>
                <span>Getting Started Guide</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="ghost" className="w-full justify-between text-foreground hover:bg-input" onClick={() => navigate('/safety-guidelines')}>
                <span>Safety Guidelines</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="ghost" className="w-full justify-between text-foreground hover:bg-input" onClick={() => navigate('/community-rules')}>
                <span>Community Rules</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="ghost" className="w-full justify-between text-foreground hover:bg-input" onClick={() => navigate('/privacy')}>
                <span>Privacy Policy</span>
                <ExternalLink className="w-4 h-4" />
              </Button>
              <Button variant="ghost" className="w-full justify-between text-foreground hover:bg-input" onClick={() => navigate('/terms')}>
                <span>Terms of Service</span>
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </Card>

          {/* Contact Form */}
          <Card className="bg-black border border-white/20 rounded-2xl">
            <h3 className="font-semibold mb-4 text-foreground">Contact Support</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-secondary">Name (Optional)</Label>
                <Input
                  id="name"
                  value={contactForm.name}
                  onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-black border-white/30 text-white rounded-xl"
                  placeholder="Your name"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-secondary">Email {user ? "(Optional)" : "*"}</Label>
                <Input
                  id="email"
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-black border-white/30 text-white rounded-xl"
                  placeholder={user?.email || "your@email.com"}
                />
              </div>
              <div>
                <Label htmlFor="subject" className="text-secondary">Subject (Optional)</Label>
                <Input
                  id="subject"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="bg-black border-white/30 text-white rounded-xl"
                  placeholder="What can we help you with?"
                />
              </div>
              <div>
                <Label htmlFor="message" className="text-secondary">Message *</Label>
                <Textarea
                  id="message"
                  value={contactForm.message}
                  onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                  className="bg-black border-white/30 text-white rounded-xl"
                  rows={4}
                  placeholder="Describe your issue or question..."
                />
              </div>
              <Button onClick={handleContactSubmit} disabled={sending} className="w-full btn-primary">
                {sending ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </Card>

          {/* App Version */}
          <Card className="bg-black border border-white/20 rounded-2xl">
            <div className="text-center text-sm text-white/50">
              <p>SpotMe App Version 1.0.0</p>
              <p>Need more help? Email us at <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">{SUPPORT_EMAIL}</a></p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;