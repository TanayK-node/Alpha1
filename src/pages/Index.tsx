import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { TrendingUp, BarChart3, PieChart, Activity } from "lucide-react";
import { WorldMap } from "@/components/ui/world-map";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleEnter = () => {
    navigate("/auth");
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* World Map Background */}
      <div className="absolute inset-0 z-0">
        <WorldMap
          dots={[
            {
              start: { lat: 40.7128, lng: -74.006 },
              end: { lat: 51.5074, lng: -0.1278 },
            },
            {
              start: { lat: 35.6762, lng: 139.6503 },
              end: { lat: 22.3193, lng: 114.1694 },
            },
            {
              start: { lat: 37.7749, lng: -122.4194 },
              end: { lat: 40.7128, lng: -74.006 },
            },
            {
              start: { lat: 48.8566, lng: 2.3522 },
              end: { lat: 52.52, lng: 13.405 },
            },
            {
              start: { lat: -33.8688, lng: 151.2093 },
              end: { lat: 1.3521, lng: 103.8198 },
            },
          ]}
          lineColor="#60a5fa"
        />
      </div>

      {/* Minimalistic Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center">
        <div className="text-center space-y-12">
          {/* AlphaForge Title */}
          <h1 className="text-8xl font-bold text-white tracking-tight">
            AlphaForge
          </h1>

          {/* Sign In Button */}
          <Button
            onClick={handleEnter}
            size="lg"
            className="px-16 py-6 text-xl font-medium bg-white text-black hover:bg-gray-200 transition-all duration-300 shadow-2xl hover:shadow-3xl"
          >
            Sign In
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
