import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Settings, 
  Shield, 
  HelpCircle, 
  Info, 
  LogOut 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import spotmeLogo from "@/assets/spotme-logo-new.png";

interface SettingsMenuProps {
  open: boolean;
  onClose: () => void;
}

const SettingsMenu = ({ open, onClose }: SettingsMenuProps) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success("Signed out successfully");
      navigate("/");
      onClose();
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const menuItems = [
    { icon: User, label: "Account Settings", color: "text-foreground", action: () => handleNavigation("/account-settings") },
    { icon: Settings, label: "App Settings", color: "text-foreground", action: () => handleNavigation("/app-settings") },
    { icon: Shield, label: "Privacy & Security", color: "text-foreground", action: () => handleNavigation("/privacy-security") },
    { icon: HelpCircle, label: "Help & Support", color: "text-foreground", action: () => handleNavigation("/help-support") },
    { icon: Info, label: "About SpotMe", color: "text-foreground", action: () => handleNavigation("/about-spotme") },
  ];

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-80 p-0">
        <SheetHeader className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <img src={spotmeLogo} alt="SpotMe" className="w-8 h-8" />
            <h2 className="text-lg font-semibold">Menu</h2>
          </div>
        </SheetHeader>
        
        <div className="px-6 space-y-1">
          {menuItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-start h-12 px-4 text-base font-normal"
              onClick={item.action}
            >
              <item.icon className={`w-5 h-5 mr-4 ${item.color}`} />
              {item.label}
            </Button>
          ))}
          
          <Separator className="my-4" />
          
          <Button
            variant="ghost"
            className="w-full justify-start h-12 px-4 text-base font-normal text-destructive hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5 mr-4" />
            Sign Out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsMenu;