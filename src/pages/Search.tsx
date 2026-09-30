import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Search as SearchIcon, X, Clock, TrendingUp, Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";


interface SearchResult {
  id: string;
  name: string;
  secondary: string;
  avatar: string;
  
}

const RECENT_SEARCHES_KEY = 'bit_recent_searches';

const Search = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
const isChatMode = searchParams.get("mode") === "chat";
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  


  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse recent searches');
      }
    }
  }, []);

  // Fetch suggested users
useEffect(() => {
  const fetchSuggested = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url")
        .neq("id", user.id)
        .limit(5);

      if (error) throw error;

      const mapped = (data || []).map((profile) => ({
        id: profile.id,
        name: profile.display_name || profile.username || "User",
        secondary: profile.username ? `@${profile.username}` : "Bit member",
        avatar:
          profile.avatar_url ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`,
        
      }));

      setSuggestedUsers(mapped);
    } catch (error) {
      console.error("Error fetching suggested users:", error);
    }
  };

  fetchSuggested();
}, [user]);
const displayedPeople = suggestedUsers;



  // Search for users
const searchUsers = useCallback(async (term: string) => {
  if (!user || !term.trim()) {
    setResults([]);
    return;
  }

  setLoading(true);

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url")
      .neq("id", user.id)
      .or(`display_name.ilike.%${term}%,username.ilike.%${term}%`)
      .limit(20);

    if (error) throw error;

    const mapped = (data || []).map((profile) => ({
      id: profile.id,
      name: profile.display_name || profile.username || "User",
      secondary: profile.username ? `@${profile.username}` : "Bit member",
      avatar: profile.avatar_url || "",
    }));

    setResults(mapped);
  } catch (error) {
    console.error("Error searching users:", error);
  } finally {
    setLoading(false);
  }
}, [user]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        searchUsers(searchTerm);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, searchUsers]);

  const handleResultClick = (result: SearchResult) => {
    // Add to recent searches
    const updated = [result, ...recentSearches.filter(r => r.id !== result.id)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    
    // Navigate to profile
    navigate(isChatMode ? `/chat/${result.id}` : `/profile/${result.id}`);
  };

  const clearRecentSearch = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter(r => r.id !== id);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const clearAllRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const isSearching = searchTerm.trim().length > 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Search Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="px-4 py-3">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white" />
            <Input
              type="text"
              placeholder="Search Bit"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 bg-input border-border text-foreground h-12"
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4">
        {/* Search Results */}
        {isSearching && (
          <div className="space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : results.length > 0 ? (
              results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={result.avatar} />
                    <AvatarFallback>{result.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{result.name}</p>
                    
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-white">
                No users found for "{searchTerm}"
              </div>
            )}
          </div>
        )}

        {/* Recent Searches */}
        {!isSearching && recentSearches.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-white">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Recent</span>
              </div>
              <button
                onClick={clearAllRecent}
                className="text-xs text-primary hover:underline"
              >
                Clear all
              </button>
            </div>
            <div className="space-y-1">
              {recentSearches.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleResultClick(item)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left group"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={item.avatar} />
                    <AvatarFallback>{item.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-sm text-white truncate">{item.secondary}</p>
                  </div>
                  <button
                    onClick={(e) => clearRecentSearch(item.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-white hover:text-foreground transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Users */}
        {!isSearching && displayedPeople.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-white mb-3">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Suggested</span>
            </div>
            <div className="space-y-1">
              {displayedPeople.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleResultClick(item)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={item.avatar} />
                    <AvatarFallback>{item.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{item.name}</p>
                    
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
)}

export default Search;
