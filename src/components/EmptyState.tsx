import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState = ({ icon: Icon, title, description, action, className }: EmptyStateProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-white mb-6 max-w-sm">{description}</p>
      {action && (
        <Button onClick={action.onClick} className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-end))]">
          {action.label}
        </Button>
      )}
    </div>
  );
};
