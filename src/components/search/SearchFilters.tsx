
import React from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface SearchFiltersProps {
  filters: {
    distance: number;
    availability: string[];
    goals: string[];
    experience: string[];
  };
  onFiltersChange: (filters: any) => void;
}

export default function SearchFilters({ filters, onFiltersChange }: SearchFiltersProps) {
  const distanceOptions = [1, 3, 5, 10, 25];
  const availabilityOptions = ['Morning', 'Afternoon', 'Evening', 'Weekend'];
  const goalOptions = ['Build Muscle', 'Lose Weight', 'Endurance', 'Flexibility', 'Strength'];
  const experienceOptions = ['Beginner', 'Intermediate', 'Advanced'];

  const toggleArrayFilter = (category: 'availability' | 'goals' | 'experience', value: string) => {
    const current = filters[category] || [];
    const updated = current.includes(value) 
      ? current.filter(item => item !== value)
      : [...current, value];
    
    onFiltersChange({
      ...filters,
      [category]: updated
    });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Filter className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Search Filters</SheetTitle>
          <SheetDescription>
            Refine your search to find the perfect workout partners
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-6 mt-6">
          {/* Distance */}
          <div>
            <h3 className="font-medium mb-3">Distance</h3>
            <div className="flex flex-wrap gap-2">
              {distanceOptions.map((distance) => (
                <Button
                  key={distance}
                  variant={filters.distance === distance ? "default" : "outline"}
className="border-white/40 text-white"
                  size="sm"
                  onClick={() => onFiltersChange({ ...filters, distance })}
                >
                  {distance} mi
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Availability */}
          <div>
            <h3 className="font-medium mb-3">Availability</h3>
            <div className="flex flex-wrap gap-2">
              {availabilityOptions.map((option) => (
                <Badge
                  key={option}
                  variant={filters.availability?.includes(option) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleArrayFilter('availability', option)}
                >
                  {option}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Goals */}
          <div>
            <h3 className="font-medium mb-3">Goals</h3>
            <div className="flex flex-wrap gap-2">
              {goalOptions.map((goal) => (
                <Badge
                  key={goal}
                  variant={filters.goals?.includes(goal) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleArrayFilter('goals', goal)}
                >
                  {goal}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Experience */}
          <div>
            <h3 className="font-medium mb-3">Experience Level</h3>
            <div className="flex flex-wrap gap-2">
              {experienceOptions.map((level) => (
                <Badge
                  key={level}
                  variant={filters.experience?.includes(level) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleArrayFilter('experience', level)}
                >
                  {level}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          <Button 
            variant="outline" 
            onClick={() => onFiltersChange({ distance: 10, availability: [], goals: [], experience: [] })}
            className="w-full"
          >
            Clear All Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
