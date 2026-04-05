import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Landing = () => {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      title: 'AI Wellness Companion',
      description: 'Chat with an empathetic AI that understands your mental health journey'
    },
    {
      title: 'Safe Community',
      description: 'Share hope notes anonymously in a toxicity-free, supportive space'
    },
    {
      title: 'Micro-Learning',
      description: 'Transform any topic into engaging flashcards for mindful learning'
    },
    {
      title: 'Mindful Habits',
      description: 'Build wellness routines with breathing exercises and positive quotes'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-accent/10 to-background">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1758274526671-ad18176acb01?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwxfHxjYWxtJTIwbWVkaXRhdGlvbiUyMG5hdHVyZSUyMHdlbGxuZXNzfGVufDB8fHx8MTc2NDQwNzUwMXww&ixlib=rb-4.1.0&q=85"
            alt="Peaceful nature scene"
            className="w-full h-full object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 to-background"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 sm:py-32">
          <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight" style={{color: 'rgb(45, 55, 72)'}}>
              Your Digital <span style={{color: 'rgb(74, 124, 89)'}}>Sanctuary</span>
            </h1>
            <p className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed" style={{color: 'rgba(45, 55, 72, 0.8)'}}>
              Break free from toxic digital habits. MindEase helps you cultivate mindful screen time,
              emotional wellness, and meaningful connections.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Button
                data-testid="get-started-btn"
                size="lg"
                className="rounded-full px-8 py-6 text-lg font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
                onClick={() => navigate('/auth')}
              >
                Get Started
              </Button>
              <Button
                data-testid="learn-more-btn"
                size="lg"
                variant="outline"
                className="rounded-full px-8 py-6 text-lg font-medium transition-all hover:scale-105 active:scale-95"
                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16 text-foreground">
            Everything You Need for Digital Wellness
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                data-testid={`feature-card-${index}`}
                className="rounded-2xl border bg-card text-card-foreground shadow-sm p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-primary/20 cursor-pointer"
                onMouseEnter={() => setActiveFeature(index)}
              >
                <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-sm text-foreground/70 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-accent/10">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Ready to Transform Your Digital Life?
          </h2>
          <p className="text-lg text-foreground/80">
            Join thousands finding peace and balance in their online journey.
          </p>
          <Button
            data-testid="cta-signup-btn"
            size="lg"
            className="rounded-full px-12 py-6 text-lg font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
            onClick={() => navigate('/auth')}
          >
            Start Your Journey
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t">
        <div className="max-w-7xl mx-auto text-center text-sm text-foreground/60">
          <p>© 2025 MindEase. Your sanctuary for digital wellness.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;