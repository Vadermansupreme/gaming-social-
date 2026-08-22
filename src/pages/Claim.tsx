import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import spotmeLogo from "@/assets/spotme-logo-new.png";

type ClaimState = "loading" | "valid" | "invalid" | "missing";

const Claim = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<ClaimState>("loading");

  const token = searchParams.get("token");

  useEffect(() => {
    // If no token in URL, show missing state
    if (!token) {
      setState("missing");
      return;
    }

    // Verify the invite token
    const verifyToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("verify-invite", {
          body: { token },
        });

        if (error) {
          console.error("Verification error:", error);
          setState("invalid");
          return;
        }

        if (data?.valid === true) {
          setState("valid");
        } else {
          setState("invalid");
        }
      } catch (err) {
        console.error("Verification failed:", err);
        setState("invalid");
      }
    };

    verifyToken();
  }, [token]);

  const handleContinue = () => {
    if (token) {
      // Store token in sessionStorage for signup to read later
      sessionStorage.setItem("spotme_invite_token", token);
    }
    navigate("/auth?from=invite");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="pt-8 pb-8 px-6 flex flex-col items-center text-center space-y-6">
          {/* Logo */}
          <img
            src={spotmeLogo}
            alt="SpotMe"
            className="h-12 w-auto"
          />

          {/* Loading State */}
          {state === "loading" && (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-white">Verifying your invite…</p>
            </>
          )}

          {/* Missing Token State */}
          {state === "missing" && (
            <>
              <AlertTriangle className="h-12 w-12 text-destructive" />
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Invalid Link</h2>
                <p className="text-white text-sm">
                  This link appears to be incomplete or invalid.
                </p>
              </div>
              <Button asChild className="w-full">
                <Link to="/">Back to Home</Link>
              </Button>
            </>
          )}

          {/* Invalid Token State */}
          {state === "invalid" && (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">
                  Invite Not Found
                </h2>
                <p className="text-white text-sm">
                  This invite link is invalid or has expired.
                </p>
              </div>
              <Button asChild className="w-full">
                <Link to="/">Back to Home</Link>
              </Button>
            </>
          )}

          {/* Valid Token State */}
          {state === "valid" && (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">
                  Invite Confirmed ✅
                </h2>
                <p className="text-white text-sm">
                  You're all set! Click below to create your account.
                </p>
              </div>
              <Button
                onClick={handleContinue}
                className="w-full bg-gradient-to-r from-primary to-[hsl(var(--primary-end))] hover:opacity-90"
              >
                Continue
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Claim;
