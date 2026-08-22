import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const getInitials = (name: string): string => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
};

interface UserAvatarProps {
  src?: string | null;
  fallback?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  onClick?: () => void;
}

const UserAvatar = ({ src, fallback = "U", size = "md", className, onClick }: UserAvatarProps) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10", 
    lg: "w-12 h-12",
    xl: "w-20 h-20"
  };

  const fallbackSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base", 
    xl: "text-xl"
  };

  return (
    <Avatar 
      className={cn(
        sizeClasses[size], 
        "ring-2 ring-primary/20 transition-all",
        onClick && "cursor-pointer hover:ring-primary/40",
        className
      )}
      onClick={onClick}
    >
      <AvatarImage 
        src={src || undefined} 
        alt="User avatar"
        className="object-cover"
      />
      <AvatarFallback className={cn(
        "bg-emerald-500 text-white font-semibold",
fallbackSizes[size],
        fallbackSizes[size]
      )}>
        {getInitials(fallback)}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
