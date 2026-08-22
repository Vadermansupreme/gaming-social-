import { Menu, Plus, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotificationCenter from "@/components/NotificationCenter";
import { supabase } from "@/integrations/supabase/client";
import spotmeLogo from "@/assets/spotme-logo-new.png";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);


const isOnSettingsPage = location.pathname === "/settings";
const isSettingsActive = settingsOpen || isOnSettingsPage;
  

  
const handleGoToSettings = () => {
  setSettingsOpen(false);
  navigate("/settings");
};

const handleGoToUpdates = () => {
  setSettingsOpen(false);
  navigate("/updates");
};

  useEffect(() => {
  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  getUser();
}, []);
    
      

  

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 pt-safe pb-2">
      <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
        <div className="flex items-center gap-3 bg-transparent">
  {location.pathname === "/profile" && (
    <button
      type="button"
      onClick={() => navigate(-1)}
      className="flex h-10 w-10 items-center justify-center text-white"
      aria-label="Go back"
    >
      <ArrowLeft className="h-6 w-6 -translate-x-14" />
    </button>
  )}

  
          <img src={spotmeLogo} alt="SpotMe" className="w-8 h-8 bg-transparent" />
          <span className="text-xl font-bold text-white tracking-tight select-none">SpotMe</span>
        </div>
        
        <div className="flex items-center gap-0">
        <Button
  variant="ghost"
  size="icon"
  onClick={() => navigate("/add")}
  className="w-10 h-10 p-0"
>
  <Plus className="w-5 h-5" />
</Button>
  <NotificationCenter userId={user?.id} />
  

  <DropdownMenu open={settingsOpen} onOpenChange={setSettingsOpen}>
    <DropdownMenuTrigger asChild>
      <Button
  variant="ghost"
  size="icon"
  className={`w-8 h-8 p-0 ${isSettingsActive ? "text-emerald-400" : ""}`}
      >
        <Menu className="w-5 h-5" />
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent
  side="bottom"
  align="end"
  sideOffset={-8}
  className="bg-black border border-white/20 text-white rounded-xl shadow-lg min-w-[140px] max-w-[calc(100vw-24px)] -translate-y-2"
>
      <DropdownMenuItem
        onClick={handleGoToSettings}
        className="cursor-pointer focus:bg-emerald-500/20 focus:text-emerald-400"
      >
        Settings
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handleGoToUpdates}
        className="cursor-pointer focus:bg-emerald-500/20 focus:text-emerald-400"
      >
        Updates
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
      </div>
    </header>
  );
};

export default Header;
