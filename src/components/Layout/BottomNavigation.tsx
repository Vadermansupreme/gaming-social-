import { useEffect, useRef, useState } from "react";
import { Home, Search, Flame, MessageCircle, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
const [isVisible, setIsVisible] = useState(true);
const lastScrollY = useRef(0);

useEffect(() => {
  const handleScroll = () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY < 80) {
      setIsVisible(true);
    } else if (currentScrollY > lastScrollY.current + 8) {
      setIsVisible(false);
    } else if (currentScrollY < lastScrollY.current - 8) {
      setIsVisible(true);
    }

    lastScrollY.current = currentScrollY;
  };

  window.addEventListener("scroll", handleScroll, { passive: true });

  return () => window.removeEventListener("scroll", handleScroll);
}, []);
  const navItems = [
    { icon: Home, label: "Home", path: "/app" },
    { icon: Search, label: "Explore", path: "/gyms" },
    { icon: Flame, label: "Pulse", path: "/pulse" },
    { icon: MessageCircle, label: "Inbox", path: "/messages" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <div
  className={`fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-white/20 transition-transform duration-300 lg:hidden ${
    isVisible ? "translate-y-0" : "translate-y-full"
  }`}
>
      <div className="flex items-center justify-around py-0.5 px-4 max-w-md mx-auto">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          const isTrending = label === "Trending";
          
         

          return (
            <Button
  key={`${label}-${path}`}
  onClick={() => {
  if (path === "/app" && location.pathname === "/app") {
    window.dispatchEvent(new Event("refreshHomeFeed"));
  } else {
    navigate(path);
  }
}}
  variant="ghost"
  className={`flex flex-col items-center justify-center h-auto w-auto px-3 py-0.5 rounded-xl border transition-all bg-transparent hover:bg-white/5 focus:bg-transparent ${
  isActive ? "bg-transparent border-transparent text-white" : "border-transparent"
}`}
>
  <div className="flex items-center justify-center translate-y-1">
    <Icon
  className={`h-6 w-6 transition-colors ${
    isTrending && isActive
      ? "text-lime-400"
      : "text-white"
  }`}
/>
  </div>
  <span
    className={`text-[13px] mt-0.5 ${
  isActive ? "text-lime-400" : "text-white"
}`}
  >
    {label}
  </span>
</Button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
