
import { useState } from "react";
import { Users, Clock, CheckCircle, X, MessageCircle, Calendar, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { spotRequests, extendedMockUsers } from "@/data/extendedMockData";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import UserAvatar from "@/components/UserAvatar";

const SpotMe = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("requests");

  const handleAcceptRequest = (requestId: string) => {
    toast.success("Spot request accepted! 🤝");
  };

  const handleDeclineRequest = (requestId: string) => {
    toast.success("Request declined");
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      return `${diffMins}m ago`;
    }
  };

  const pendingRequests = spotRequests.filter(req => req.status === 'pending');
  const acceptedRequests = spotRequests.filter(req => req.status === 'accepted');
  const activeConnections = extendedMockUsers.slice(0, 3);

  return (
    <div className="px-4 pt-6 pb-20">
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">SpotMe</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Requests
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="accepted">
            <CheckCircle className="w-4 h-4 mr-1" />
            Accepted
          </TabsTrigger>
          <TabsTrigger value="connections">
            <Users className="w-4 h-4 mr-1" />
            Connections
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Pending Requests</h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/search')}
            >
              Find Spotters
            </Button>
          </div>

          {pendingRequests.length === 0 ? (
            <Card className="p-8 text-center">
              <Clock className="w-12 h-12 mx-auto mb-4 text-white" />
              <h3 className="text-lg font-semibold mb-2">No pending requests</h3>
              <p className="text-white mb-4">
                Start connecting with other fitness enthusiasts
              </p>
              <Button onClick={() => navigate('/search')}>
                Find Workout Partners
              </Button>
            </Card>
          ) : (
            pendingRequests.map((request) => (
              <Card key={request.id} className="p-4 bg-black border border-white/20">
                <div className="flex items-start gap-4">
                  <UserAvatar 
                    src={request.requester.avatar}
                    fallback={request.requester.name || request.requester.initials}
                    size="lg"
                    onClick={() => navigate(`/profile/${request.requester.id}`)}
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{request.requester.name}</h3>
                      <span className="text-xs text-white">
                        {formatTimeAgo(request.created_at)}
                      </span>
                    </div>
                    
                    <p className="text-xs text-white mb-3">
                      Wants to do: <span className="font-medium text-foreground">{request.activity}</span>
                    </p>
                    
                    <p className="text-xs mb-4">{request.message}</p>
                    
                    <div className="flex gap-3">
                      <Button 
                        className="flex-1"
                        onClick={() => handleAcceptRequest(request.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accept
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleDeclineRequest(request.id)}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Decline
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => navigate(`/chat/${request.requester.id}`)}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="accepted" className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold">Upcoming Sessions</h2>
          
          {acceptedRequests.length === 0 ? (
            <Card className="p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-white" />
              <h3 className="text-lg font-semibold mb-2">No upcoming sessions</h3>
              <p className="text-white">
                Accept some requests to start working out together
              </p>
            </Card>
          ) : (
            acceptedRequests.map((request) => (
              <Card key={request.id} className="p-4 bg-black border border-white/20">
                <div className="flex items-start gap-4">
                  <UserAvatar 
                    src={request.requester.avatar}
                    fallback={request.requester.name || request.requester.initials}
                    size="lg"
                    onClick={() => navigate(`/profile/${request.requester.id}`)}
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{request.requester.name}</h3>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Accepted
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-white mb-2">
                      Activity: <span className="font-medium text-foreground">{request.activity}</span>
                    </p>
                    
                    <p className="text-sm mb-4">{request.message}</p>
                    
                    <div className="flex gap-3">
                      <Button 
                        className="flex-1"
                        onClick={() => navigate(`/chat/${request.requester.id}`)}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Plan Session
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => navigate(`/profile/${request.requester.id}`)}
                      >
                        View Profile
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="connections" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your Workout Partners</h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/search')}
            >
              Find More
            </Button>
          </div>
          
          <div className="grid gap-4">
            {activeConnections.map((user) => (
              <Card key={user.id} className="p-4 bg-black border border-white/20">
                <div className="flex items-center gap-4">
                  <UserAvatar 
                    src={user.avatar}
                    fallback={user.name || user.initials}
                    size="lg"
                    onClick={() => navigate(`/profile/${user.id}`)}
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{user.name}</h3>
                      {user.verified && (
                        <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-sm text-white mb-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {user.distance} • {user.workoutType}
                    </p>
                    
                    <div className="flex items-center gap-2 text-xs text-white">
                      <span>⭐ {user.rating}</span>
                      <span>•</span>
                      <span>{user.experience}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button 
                      size="sm"
                      onClick={() => navigate(`/chat/${user.id}`)}
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Message
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        toast.success(`Spot request sent to ${user.name}!`);
                      }}
                    >
                      Spot Me!
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SpotMe;
