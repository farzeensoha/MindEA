import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, setAuthToken } from '@/utils/api';
import { toast } from 'sonner';

const Settings = () => {
  const { theme, changeTheme } = useTheme();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('mindease-user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleThemeChange = async (newTheme) => {
    try {
      await axios.patch(`${API}/auth/theme`, { theme: newTheme });
      changeTheme(newTheme);
      toast.success('Theme updated!');
    } catch (error) {
      toast.error('Failed to update theme');
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    localStorage.removeItem('mindease-user');
    toast.success('Logged out successfully');
    navigate('/');
  };

  const themes = [
    {
      id: 'calm',
      name: 'Serenity',
      description: 'Calming greens and soft tones',
      preview: 'bg-gradient-to-br from-[#4A7C59] to-[#C6F6D5]'
    },
    {
      id: 'dark',
      name: 'Deep Sleep',
      description: 'Easy on the eyes for night use',
      preview: 'bg-gradient-to-br from-[#0F172A] to-[#818CF8]'
    },
    {
      id: 'vibrant',
      name: 'Energy Flow',
      description: 'Bright and energizing colors',
      preview: 'bg-gradient-to-br from-[#F97316] to-[#FDBA74]'
    }
  ];

  return (
    <div data-testid="settings-page" className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground tracking-tight">Settings</h1>
        <p className="text-foreground/70">Customize your MindEase experience</p>
      </div>

      {/* Profile */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm text-foreground/70">Name</Label>
            <p className="text-lg font-medium">{user?.name}</p>
          </div>
          <div>
            <Label className="text-sm text-foreground/70">Email</Label>
            <p className="text-lg font-medium">{user?.email}</p>
          </div>
          <div>
            <Label className="text-sm text-foreground/70">Guardian / Parent Email</Label>
            <input
              type="email"
              className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2 text-base text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={user?.guardian_email || ''}
              onChange={(e) => setUser({ ...user, guardian_email: e.target.value })}
              placeholder="guardian@example.com"
            />
            <Button
              className="mt-3 rounded-full"
              onClick={async () => {
                if (!user?.guardian_email) {
                  toast.error('Please enter a valid guardian email');
                  return;
                }
                try {
                  await axios.patch(`${API}/auth/guardian`, {
                    guardian_email: user.guardian_email
                  });
                  localStorage.setItem('mindease-user', JSON.stringify(user));
                  toast.success('Guardian email saved');
                } catch (error) {
                  toast.error('Failed to save guardian email');
                }
              }}
            >
              Save Guardian Email
            </Button>
          </div>
          <Button
            data-testid="logout-btn"
            variant="destructive"
            onClick={handleLogout}
            className="rounded-full"
          >
            Logout
          </Button>
        </CardContent>
      </Card>

      {/* Theme Switcher */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose your preferred theme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {themes.map((themeOption) => (
              <div
                key={themeOption.id}
                data-testid={`theme-option-${themeOption.id}`}
                className={`rounded-2xl border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
                  theme === themeOption.id ? 'border-primary shadow-lg' : 'border-border'
                }`}
                onClick={() => handleThemeChange(themeOption.id)}
              >
                <div className={`h-24 rounded-xl mb-3 ${themeOption.preview}`}></div>
                <h3 className="font-semibold text-foreground">{themeOption.name}</h3>
                <p className="text-sm text-foreground/70">{themeOption.description}</p>
                {theme === themeOption.id && (
                  <div className="mt-2 text-xs text-primary font-medium">Active</div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chrome Extension Info */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Make Sure your Extension is connected</CardTitle>
          <CardDescription>Enjoy browsing, we've got your back!</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
};

export default Settings;