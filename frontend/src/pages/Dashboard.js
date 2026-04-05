import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import axios from 'axios';
import { API } from '@/utils/api';
import { Activity, Heart, TrendingUp, Zap } from 'lucide-react';

const Dashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 NEW: modal state
  const [showScreenTimeModal, setShowScreenTimeModal] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/analytics`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 NEW: mock hourly breakdown generator (frontend-only, demo-safe)
  const generateHourlyUsage = (totalMinutes) => {
    const hours = Array(24).fill(0);
    let remaining = totalMinutes;

    const activeHours = [10, 12, 14, 16, 18, 20, 21, 22];

    activeHours.forEach((h) => {
      if (remaining <= 0) return;
      const chunk = Math.min(remaining, Math.floor(Math.random() * 25) + 15);
      hours[h] = chunk;
      remaining -= chunk;
    });

    return hours;
  };

  const hourlyUsage = analytics
    ? generateHourlyUsage(analytics.total_screen_time || 0)
    : [];

  const peakHour =
    hourlyUsage.length > 0
      ? hourlyUsage.indexOf(Math.max(...hourlyUsage))
      : null;

  const stats = [
    {
      title: 'Screen Time',
      value: analytics?.total_screen_time || 0,
      unit: 'minutes',
      icon: Activity,
      color: 'text-blue-500',
      description: 'From extension data'
    },
    {
      title: 'Positive Interactions',
      value: analytics?.positive_interactions || 0,
      unit: 'actions',
      icon: Heart,
      color: 'text-primary',
      description: 'Community & wellness'
    },
    {
      title: 'Toxic Content Blocked',
      value: analytics?.toxic_content_detected || 0,
      unit: 'items',
      icon: TrendingUp,
      color: 'text-orange-500',
      description: 'Protected browsing'
    },
    {
      title: 'Learning Streak',
      value: analytics?.wellness_streak || 0,
      unit: 'flashcards',
      icon: Zap,
      color: 'text-yellow-500',
      description: 'Keep it going!'
    }
  ];

  return (
    <div data-testid="dashboard-page" className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-foreground/70">Your wellness journey at a glance</p>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              data-testid={`stat-card-${index}`}
              onClick={() => {
                if (stat.title === 'Screen Time') {
                  setShowScreenTimeModal(true);
                }
              }}
              className="cursor-pointer rounded-2xl border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-primary/20"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-foreground/70">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-foreground">
                    {loading ? '...' : stat.value}
                  </div>
                  <p className="text-xs text-foreground/50">{stat.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 🔹 NEW: Screen Time Modal */}
      {showScreenTimeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-card rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Today’s Screen Time</h2>
              <button
                onClick={() => setShowScreenTimeModal(false)}
                className="text-foreground/50 hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {/* Timeline Chart */}
            <div className="space-y-2">
              <div className="flex items-end gap-1 h-32">
                {hourlyUsage.map((value, hour) => (
                  <div
                    key={hour}
                    title={`${hour}:00 — ${value} min`}
                    className={`flex-1 rounded-md transition-all ${
                      hour >= 20 ? 'bg-purple-400' : 'bg-primary'
                    }`}
                    style={{ height: `${value * 2}px` }}
                  />
                ))}
              </div>

              <div className="flex justify-between text-xs text-foreground/50">
                <span>10AM</span>
                <span>2PM</span>
                <span>6PM</span>
                <span>10PM</span>
              </div>
            </div>

            {/* Insights */}
            <div className="mt-4 space-y-2 text-sm">
              <p>
                <strong>Peak usage:</strong>{' '}
                {peakHour !== null
                  ? `${peakHour}:00 – ${peakHour + 1}:00`
                  : 'N/A'}
              </p>

              {peakHour >= 20 && (
                <p className="text-purple-600">
                  🌙 Most used during night hours — consider winding down.
                </p>
              )}

              <p className="text-foreground/70">
                💡 Suggestion: Try a 10-minute mindful break.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Message */}
      <Card className="rounded-2xl border bg-card text-card-foreground shadow-sm">
        <CardHeader>
          <CardTitle>Welcome to MindEase</CardTitle>
          <CardDescription>
            Your personal dashboard will show insights from the Chrome extension once you install it.
            For now, explore the wellness tools and community features!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <h3 className="font-semibold mb-2 text-foreground">Get Started</h3>
              <p className="text-sm text-foreground/70">
                Try the AI chatbot in Wellness Tools, share a Hope Note in Community, Make your social bubbles or create flashcards in Learning!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
