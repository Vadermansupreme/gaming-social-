import { useState } from "react";
import { ArrowLeft, Globe, Download, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDarkMode, ThemePreference } from "@/hooks/useDarkMode";

const AppSettings = () => {
  const navigate = useNavigate();
  const { themePreference, setThemePreference } = useDarkMode();
const [settings] = useState({
    locationSharing: false,
    autoBackup: true,
    language: "english",
    units: "imperial"
  });

  return (
    <div className="bg-background min-h-screen">
      <div className="px-4 pt-6 pb-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-end))] bg-clip-text text-transparent">
            App Settings
          </h1>
        </div>

        <div className="space-y-6">
          {/* Display Settings */}
          <Card className="bg-black border border-white/20 rounded-2xl p-5">
            <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Display Settings
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">Theme</Label>
                <p className="text-sm text-white/50">Choose your preferred theme</p>
                <Select 
                  value={themePreference} 
                  onValueChange={(value) => setThemePreference(value as ThemePreference)}
                >
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 opacity-60">
                <Label className="text-foreground">Language <span className="text-xs text-white/50">(Coming soon)</span></Label>
                <Select value={settings.language} disabled>
                  <SelectTrigger className="bg-input border-border text-foreground cursor-not-allowed">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="spanish">Español</SelectItem>
                    <SelectItem value="french">Français</SelectItem>
                    <SelectItem value="german">Deutsch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 opacity-60">
                <Label className="text-foreground">Units <span className="text-xs text-white/50">(Coming soon)</span></Label>
                <Select value={settings.units} disabled>
                  <SelectTrigger className="bg-input border-border text-foreground cursor-not-allowed">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="imperial">Imperial (lbs, ft)</SelectItem>
                    <SelectItem value="metric">Metric (kg, m)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Privacy Settings */}
          <Card className="bg-black border border-white/20 rounded-2xl p-5 opacity-60">
            <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Privacy & Location
              <span className="text-xs text-white/50 font-normal">(Coming soon)</span>
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-foreground">Location Sharing</Label>
                  <p className="text-sm text-white/50">Allow others to see your location</p>
                </div>
                <Switch
                  checked={settings.locationSharing}
                  disabled
                  className="cursor-not-allowed"
                />
              </div>
            </div>
          </Card>

          {/* Data & Storage */}
          <Card className="bg-black border border-white/20 rounded-2xl p-5">
            <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
              <Download className="w-5 h-5" />
              Data & Storage
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between opacity-60">
                <div className="space-y-0.5">
                  <Label className="text-foreground">Auto Backup <span className="text-xs text-white/50">(Coming soon)</span></Label>
                  <p className="text-sm text-white/50">Automatically backup your data</p>
                </div>
                <Switch
                  checked={settings.autoBackup}
                  disabled
                  className="cursor-not-allowed"
                />
              </div>
              <Button variant="outline" className="w-full border-border text-white/50 opacity-60 cursor-not-allowed" disabled>
                Export Data (Coming soon)
              </Button>
              <Button variant="outline" className="w-full border-border text-white/50 opacity-60 cursor-not-allowed" disabled>
                Clear Cache (Coming soon)
              </Button>
            </div>
          </Card>

          {/* App Information */}
          <Card className="bg-black border border-white/20 rounded-2xl p-5">
            <h3 className="font-semibold mb-4 text-foreground">App Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">Version</span>
                <span className="text-foreground">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Build</span>
                <span className="text-foreground">2024.01.15</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AppSettings;