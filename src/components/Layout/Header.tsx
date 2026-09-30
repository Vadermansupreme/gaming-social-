import { Menu, Plus, ArrowLeft, Search } from "lucide-react";
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
    <header className="fixed top-3 left-0 right-0 z-50 bg-background/95 pt-safe pb-2">
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between rounded-2xl border border-white/10 bg-black/70 px-5 py-3">
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

  
          <div className="w-8 h-8 rounded-lg border border-white flex items-center justify-center font-bold text-white">
  b
</div>
          <span className="text-xl font-bold text-white tracking-tight select-none">bit</span>
        </div>
        <div className="hidden md:flex flex-1 justify-center px-8">
  <div className="flex w-full max-w-[430px] items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3">
    <Search className="h-5 w-5 text-white/40" />

    <input
      type="text"
      placeholder="Search bit"
      className="w-full bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
    />
  </div>
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
