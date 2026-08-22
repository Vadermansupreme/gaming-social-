import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, MessageSquare, FileText, UserPlus, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface Stats {
  totalUsers: number;
  newUsersWeek: number;
  totalMessages: number;
  totalPosts: number;
  totalFeedback: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    newUsersWeek: 0,
    totalMessages: 0,
    totalPosts: 0,
    totalFeedback: 0,
  });

  useEffect(() => {
    checkAdminAndLoadStats();
  }, []);

  const checkAdminAndLoadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Check if user has admin role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleData) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      setAuthorized(true);

      // Fetch stats
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const [
        { count: totalUsers },
        { count: newUsersWeek },
        { count: totalMessages },
        { count: totalPosts },
        { count: totalFeedback },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
          .gte('created_at', oneWeekAgo.toISOString()),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true })
          .is('deleted_at', null),
        supabase.from('user_feedback').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        totalUsers: totalUsers || 0,
        newUsersWeek: newUsersWeek || 0,
        totalMessages: totalMessages || 0,
        totalPosts: totalPosts || 0,
        totalFeedback: totalFeedback || 0,
      });
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-xl font-bold mb-2">Not Authorized</h1>
          <p className="text-white mb-4">
            You don't have permission to access the admin dashboard.
          </p>
          <Button onClick={() => navigate('/app')}>
            Go to Home
          </Button>
        </Card>
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-500" },
    { label: "New Users (7d)", value: stats.newUsersWeek, icon: UserPlus, color: "text-green-500" },
    { label: "Total Messages", value: stats.totalMessages, icon: MessageSquare, color: "text-purple-500" },
    { label: "Total Posts", value: stats.totalPosts, icon: FileText, color: "text-orange-500" },
    { label: "Feedback", value: stats.totalFeedback, icon: Activity, color: "text-pink-500" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center justify-between px-4 py-3 max-w-4xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Admin Dashboard</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.label} className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <span className="text-sm text-white">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
            </Card>
          ))}
        </div>

        {/* Recent Activity Section - placeholder for future */}
        <Card className="mt-6 p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => navigate('/search')}>
              View Users
            </Button>
            <Button variant="outline" onClick={() => navigate('/app')}>
              View Feed
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
