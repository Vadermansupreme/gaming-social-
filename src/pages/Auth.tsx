
import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import spotmeLogo from "@/assets/spotme-logo-new.png";
import authBg from "../assets/auth-bg.png";
import { signUpSchema, signInSchema } from "@/lib/validation";

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [authMode, setAuthMode] = useState<"welcome" | "signin" | "signup">("welcome");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Determine initial tab based on URL params (from invite flow)
  const getInitialTab = () => {
    const token = searchParams.get("token");
    const from = searchParams.get("from");
    return (token || from === "invite") ? "signup" : "signin";
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/app");
      }
    };
    checkUser();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = signUpSchema.safeParse({ email, password, firstName, lastName, phone });
      
      if (!result.success) {
        const firstError = result.error.errors[0];
        throw new Error(firstError.message);
      }

      const validatedData = result.data;
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: validatedData.firstName,
            last_name: validatedData.lastName,
            display_name: `${validatedData.firstName} ${validatedData.lastName}`,
            phone: validatedData.phone || null
          }
        }
      });

      if (error) throw error;

// If NO email confirmation required → go straight to onboarding
console.log("SIGNUP SUCCESS - would go to onboarding");

// If email confirmation IS required → keep the toast (optional)
toast({
  title: "Check your email",
  description: "We've sent you a confirmation link to complete your registration.",
});
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = signInSchema.safeParse({ email, password });
      
      if (!result.success) {
        const firstError = result.error.errors[0];
        throw new Error(firstError.message);
      }

      const validatedData = result.data;

      const { error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You've been signed in successfully.",
      });
      navigate("/app");
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Check your email",
        description: "We've sent you a password reset link.",
      });
      setShowForgotPassword(false);
      setForgotEmail("");
    } catch (error: any) {
      console.error("Forgot password error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
       
        <Card className="relative z-[9999] w-full max-w-[700px] h-[760px] bg-white/0 border border-white/5 rounded-[40px] backdrop-blur-2xl shadow-2xl flex flex-col justify-center px-16">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-6">
  <div className="w-20 h-20 rounded-3xl border border-emerald-400/40 bg-black/20 flex items-center justify-center">
    <span className="text-5xl font-black text-emerald-400">
      S
    </span>
  </div>
</div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-end))] bg-clip-text text-transparent">
              Reset Password
            </CardTitle>
            <CardDescription>
              Enter your email and we'll send you a reset link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="Enter your email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </div>
              <Button
  type="submit"
  disabled={loading}
  className="w-full h-11 rounded-xl border border-emerald-400/50 bg-black/10 text-emerald-400 font-semibold hover:bg-emerald-400/10 transition-all duration-300"
>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setShowForgotPassword(false)}
              >
                Back to Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
<div className="min-h-screen bg-black text-white overflow-hidden">
   <div className="fixed inset-0 z-[99999] flex items-center justify-center gap-24 pointer-events-auto bg-black/20">
   <div className="hidden xl:flex items-center justify-center -translate-x-40">
  <div className="w-96 h-96 rounded-[80px] border-[3px] border-emerald-400/30 bg-black/50 flex items-center justify-center pt-2 translate-x-[60px] shadow-[0_0_80px_rgba(52,211,153,0.15)]">
  <span className="big-logo-s text-[310px] leading-none font-black text-emerald-400 -translate-x-[1px]">
    S
  </span>
</div>
</div>
  <Card className="relative z-[9999] left-[110px] w-full max-w-[700px] h-[760px] bg-white/0 border border-white/5 backdrop-blur-2xl rounded-[32px] px-10 py-12 shadow-[0_0_60px_rgba(16,185,129,0.15)]">
    
    <CardHeader className="text-center space-y-4">
      <div className="mx-auto w-20 h-20 rounded-3xl border border-emerald-400/40 bg-black/20 flex items-center justify-center">
        <span className="text-5xl font-black text-emerald-400 leading-none -translate-y-[1px]">S</span>
      </div>

      <div>
        <h1 className="text-5xl font-black text-white tracking-tight">
          SpotMe
        </h1>

        <p className="text-zinc-400 mt-2 text-lg">
          What’s your vibe?
        </p>
      </div>
    </CardHeader>

    <CardContent className="mt-8 bg-transparent">
      <Tabs defaultValue={getInitialTab()} className="w-full">
        
        <TabsList className="grid w-full grid-cols-2 bg-transparent gap-4 mb-8">
          <TabsTrigger
            value="signin"
            className="h-14 rounded-2xl border border-emerald-400/40 bg-black/20 text-white"
          >
            Sign In
          </TabsTrigger>

          <TabsTrigger
            value="signup"
            className="h-14 rounded-2xl border border-emerald-400/40 bg-black/20 text-white"
          >
            Sign Up
          </TabsTrigger> 
        </TabsList>

        <TabsContent value="signin" className="bg-transparent">
          <form onSubmit={handleSignIn} className="flex flex-col gap-5 bg-transparent">
            <Input
              placeholder="Enter your email"
              value={email}
onChange={(e) => setEmail(e.target.value)}
              className="h-14 rounded-2xl bg-white/10 border border-white/10 text-white font-sans font-sans font-light shadow-none focus:border-emerald-400/20"
            />

            <Input
              type="password"
              placeholder="Enter your password"
              value={password}
onChange={(e) => setPassword(e.target.value)}
              className="h-14 rounded-2xl bg-white/10 border border-white/10 font-sans font-light text-white shadow-none"
            />
            <Button
            className="w-full h-11 rounded-xl border border-emerald-400/50 bg-black/10 text-emerald-400 font-semibold tracking-wide transition-all duration-300 hover:bg-emerald-400/10 hover:border-emerald-400"
            >
              Sign In
            </Button>
            <button
  type="button"
  onClick={() => setShowForgotPassword(true)}
  className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors"
>
  Forgot password?
</button>
            
          </form>
        </TabsContent>

        <TabsContent value="signup">
          <form onSubmit={handleSignUp} className="space-y-5 bg-transparent">
          <Input
  placeholder="First name"
  value={firstName}
  onChange={(e) => setFirstName(e.target.value)}
  className="..."
/>

<Input
  placeholder="Last name"
  value={lastName}
  onChange={(e) => setLastName(e.target.value)}
  className="..."
/>
            <Input
  placeholder="Enter your email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  className="..."
/>

            <Input
  type="password"
  placeholder="Create a password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  className="..."
/>

            <Button
  className="w-full h-11 rounded-xl border border-emerald-400/50 bg-black/10 text-emerald-400 font-semibold tracking-wide transition-all duration-300 hover:bg-emerald-400/10 hover:border-emerald-400"
>
  Sign Up
</Button>
          </form>
        </TabsContent>

      </Tabs>
    </CardContent>
  </Card>
</div>   



{/* FULL SCREEN COLLAGE BACKGROUND */}
<div className="absolute inset-0 overflow-hidden z-0">

      

      <div className="absolute inset-0 bg-black"></div>

      
      <div className="absolute inset-0 grid grid-cols-4 grid-rows-3 gap-2 p-2 overflow-hidden">

  <div className="overflow-hidden rounded-[24px] rotate-[-2deg]">
    <img
      src="/auth-collage/jogging .jpg"
      className="w-full h-full object-cover brightness-50 saturate-75"
    />
  </div>

  <div className="overflow-hidden rounded-[24px] rotate-[2deg]">
    <img
      src="/auth-collage/boxer hands .jpg"
      className="w-full h-full object-cover brightness-50 saturate-75"
    />
  </div>

  <div className="overflow-hidden rounded-[24px] rotate-[-1deg]">
    <img
      src="/auth-collage/deadlift .jpg"
      className="w-full h-full object-cover brightness-50 saturate-75"
    />
  </div>

  <div className="overflow-hidden rounded-[24px] rotate-[1deg] row-span-2">
    <img
      src="/auth-collage/indoor treadmill.jpg"
      className="w-full h-full object-cover brightness-50 saturate-75"
    />
  </div>

  <div className="overflow-hidden rounded-[24px] rotate-[1deg] col-span-2">
    <img
      src="/auth-collage/bike marathon .jpg"
      className="w-full h-full object-cover brightness-50 saturate-75"
    />
  </div>

  <div className="overflow-hidden rounded-[24px] rotate-[-2deg] row-span-2">
    <img
      src="/auth-collage/tennis.jpg"
      className="w-full h-full object-cover brightness-50 saturate-75"
    />
  </div>

  <div className="overflow-hidden rounded-[24px] rotate-[2deg]">
    <img
      src="/auth-collage/yoga pose.png"
      className="w-full h-full object-cover brightness-50 saturate-75"
    />
  </div>

  <div className="overflow-hidden rounded-[24px] rotate-[-1deg] col-span-2">
    <img
      src="/auth-collage/battle ropes 2.jpg"
      className="w-full h-full object-cover brightness-50 saturate-75"
    />
  </div>

</div>


  




{/* RIGHT SIDE */}
<div className="flex relative items-center justify-center bg-black overflow-hidden">

  {/* Background Glow */}
  <div className="absolute inset-0 bg-black"></div>

  {/* Main Content */}
  <div className="relative z-30 w-full h-full flex flex-col justify-center px-16">


    {/* CARD AREA */}

   <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 grid-flow-dense gap-1 p-2 overflow-hidden">

  <div className="overflow-hidden col-span-2 row-span-2">
    <img src="/auth-collage/real track.png" className="w-full h-full object-cover brightness-50 scale-110 -rotate-1" />
  </div>

  <div className="overflow-hidden col-span-2 row-span-1">
    <img src="/auth-collage/real road bike.png" className="w-full h-full object-cover brightness-50 scale-125 rotate-3" />
  </div>

  <div className="overflow-hidden col-span-2 row-span-1">
    <img src="/auth-collage/real curl bar.png" className="w-full h-full object-cover brightness-50 scale-110" />
  </div>

  <div className="overflow-hidden col-span-2 row-span-2">
    <img src="/auth-collage/real tennis woman.png" className="w-full h-full object-cover brightness-50 scale-115 rotate-1" />
  </div>

  <div className="overflow-hidden col-span-2 row-span-1">
    <img src="/auth-collage/real road bike.png" className="w-full h-full object-cover brightness-50 scale-110 -rotate-2" />
  </div>

  <div className="overflow-hidden col-span-2 row-span-1">
    <img src="/auth-collage/red hat.png" className="w-full h-full object-cover brightness-50 scale-125 rotate-2" />
  </div>

  <div className="overflow-hidden col-span-2 row-span-1">
    <img src="/auth-collage/battle ropes .png" className="w-full h-full object-cover brightness-50 scale-110" />
  </div>

  <div className="overflow-hidden col-span-2 row-span-1">
    <img src="/auth-collage/real jump rope.png" className="w-full h-full object-cover brightness-50 scale-125 -rotate-3" />
  </div>

  <div className="overflow-hidden col-span-1 row-span-1">
    <img src="/auth-collage/real treadmill.png" className="w-full h-full object-cover brightness-50 scale-110 rotate-1" />
  </div>

  <div className="overflow-hidden col-span-1 row-span-1">
    <img src="/auth-collage/red hat.png" className="w-full h-full object-cover brightness-50 scale-125 -rotate-2" />
  </div>

  <div className="overflow-hidden col-span-1 row-span-1">
    <img src="/auth-collage/real curl bar.png" className="w-full h-full object-cover brightness-50 scale-110 rotate-2" />
  </div>

  <div className="overflow-hidden col-span-1 row-span-1">
    <img src="/auth-collage/real road bike.png" className="w-full h-full object-cover brightness-50 scale-125 rotate-3" />
  </div>

  <div className="absolute inset-0 bg-gradient-to-br from-black/45 via-black/25 to-black/55 z-10 pointer-events-none" />


</div>

  
    <div className="relative left-[180px] z-50 mt-10 h-[1000px] w-[760px] scale-[0.94] origin-center">

<div className="absolute top-[180px] left-[220px] h-[520px] w-[520px] rounded-full bg-emerald-500/10 blur-[120px]"></div>

  



</div>



  </div>
</div>










</div>
</div>
);
};

export default Auth;

