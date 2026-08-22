
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import spotmeLogo from "@/assets/spotme-logo-new.png";

type ResetState = "loading" | "ready" | "success" | "error";

const ResetPassword = () => {
  const [resetState, setResetState] = useState<ResetState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const initializeReset = async () => {
      try {
        // Check for PKCE code in URL params (code-based flow)
        const code = searchParams.get("code");
        
        if (code) {
          // Exchange the code for a session
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("Code exchange error:", error);
            setErrorMessage("This reset link is invalid or has expired. Please request a new one.");
            setResetState("error");
            return;
          }
          setResetState("ready");
          return;
        }

        // Check for token in URL hash (fragment-based flow)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");

        if (accessToken && type === "recovery") {
          // Set the session using the tokens from the hash
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || "",
          });
          
          if (error) {
            console.error("Session set error:", error);
            setErrorMessage("This reset link is invalid or has expired. Please request a new one.");
            setResetState("error");
            return;
          }
          
          // Clear the hash from URL for cleaner UX
          window.history.replaceState(null, "", window.location.pathname);
          setResetState("ready");
          return;
        }

        // Check if we already have a valid session (user might have clicked link before)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setResetState("ready");
          return;
        }

        // Listen for auth state changes (PASSWORD_RECOVERY event)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === "PASSWORD_RECOVERY" && session) {
            setResetState("ready");
          } else if (event === "SIGNED_IN" && session) {
            setResetState("ready");
          }
        });

        // Give a brief moment for auth events to fire
        setTimeout(() => {
          // If still loading after timeout, show error
          setResetState((current) => {
            if (current === "loading") {
              setErrorMessage("This reset link is invalid or has expired. Please request a new one.");
              return "error";
            }
            return current;
          });
        }, 3000);

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error("Reset initialization error:", error);
        setErrorMessage("Something went wrong. Please try again.");
        setResetState("error");
      }
    };

    initializeReset();
  }, [searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setResetState("success");
      toast({
        title: "Password updated!",
        description: "Your password has been successfully reset.",
      });

      // Redirect to app after a short delay
      setTimeout(() => {
        navigate("/app");
      }, 2000);
    } catch (error: any) {
      console.error("Reset password error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (resetState === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-border">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Password Reset Successful!
            </CardTitle>
            <CardDescription>
              Redirecting you to the app...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Error state
  if (resetState === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-border">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-16 h-16 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Link Expired
            </CardTitle>
            <CardDescription className="text-white">
              {errorMessage}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button 
              onClick={() => navigate("/auth")}
              className="w-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-end))] text-primary-foreground"
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (resetState === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-border">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img src={spotmeLogo} alt="SpotMe" className="w-16 h-16" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-end))] bg-clip-text text-transparent">
              Verifying Reset Link
            </CardTitle>
            <CardDescription>
              Please wait while we verify your reset link...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Ready state - show reset form
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => navigate("/auth")}
        className="absolute top-4 left-4"
      >
        <ArrowLeft className="w-5 h-5" />
      </Button>
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={spotmeLogo} alt="SpotMe" className="w-16 h-16" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-end))] bg-clip-text text-transparent">
            Set New Password
          </CardTitle>
          <CardDescription>
            Enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-end))] text-primary-foreground" 
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
