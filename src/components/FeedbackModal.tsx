import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

const categories = [
  { value: "bug", label: "Bug Report" },
  { value: "feature_request", label: "Feature Request" },
  { value: "account_issue", label: "Account Issue" },
  { value: "other", label: "Other" },
];

export const FeedbackModal = ({ open, onClose }: FeedbackModalProps) => {
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!category || !message.trim()) {
      toast.error("Please select a category and enter a message");
      return;
    }

    try {
      setSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to submit feedback");
        return;
      }

      const { error } = await supabase
        .from('user_feedback')
        .insert({
          user_id: user.id,
          category,
          message: message.trim(),
        });

      if (error) throw error;

      toast.success("Thanks for the feedback!");
      setCategory("");
      setMessage("");
      onClose();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Describe your feedback, bug, or feature request..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px]"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={submitting || !category || !message.trim()}
              className="flex-1 btn-primary"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Feedback"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackModal;
