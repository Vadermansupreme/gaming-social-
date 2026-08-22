
import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fitnessActivities } from "@/data/extendedMockData";

interface ActivityFilterProps {
  selectedActivity: string | null;
  onActivitySelect: (activityId: string | null) => void;
}

export default function ActivityFilter({ selectedActivity, onActivitySelect }: ActivityFilterProps) {
  const selectedActivityData = selectedActivity 
    ? fitnessActivities.find(a => a.id === selectedActivity)
    : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="h-10 px-4 justify-between min-w-[140px]"
        >
          <span className="flex items-center gap-2">
            {selectedActivityData ? (
              <>
                <span>{selectedActivityData.emoji}</span>
                <span className="truncate">{selectedActivityData.name}</span>
              </>
            ) : (
              <>
                <span>🏃</span>
                <span>Find by Activity</span>
              </>
            )}
          </span>
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 max-h-[300px] overflow-y-auto">
        <DropdownMenuItem 
          onClick={() => onActivitySelect(null)}
          className="flex items-center gap-3 py-2"
        >
          <span className="text-lg">🏃</span>
          <div>
            <div className="font-medium">All Activities</div>
            <div className="text-xs text-white">Show everyone</div>
          </div>
        </DropdownMenuItem>
        {fitnessActivities.map((activity) => (
          <DropdownMenuItem 
            key={activity.id}
            onClick={() => onActivitySelect(activity.id)}
            className="flex items-center gap-3 py-2"
          >
            <span className="text-lg">{activity.emoji}</span>
            <div>
              <div className="font-medium">{activity.name}</div>
              <div className="text-xs text-white">{activity.description}</div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
