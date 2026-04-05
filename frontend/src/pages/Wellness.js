import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import axios from 'axios';
import { API } from '@/utils/api';
import { toast } from 'sonner';
import { MessageCircle, Quote, Wind } from 'lucide-react';

const Wellness = () => {
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [quotes, setQuotes] = useState([]);
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState('ready');
  const [breathingCount, setBreathingCount] = useState(0);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const response = await axios.get(`${API}/wellness/quotes`);
      setQuotes(response.data);
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
    }
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMessage = chatMessage;
    setChatMessage('');
    setChatHistory([...chatHistory, { type: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const response = await axios.post(`${API}/wellness/chat`, { message: userMessage });
      setChatHistory(prev => [...prev, { type: 'bot', text: response.data.response }]);
    } catch (error) {
      toast.error('Failed to send message');
      setChatHistory(prev => [...prev, { type: 'bot', text: 'Sorry, I\'m having trouble connecting. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const startBreathingExercise = () => {
    setBreathingActive(true);
    setBreathingCount(0);
    runBreathingCycle();
  };

  const runBreathingCycle = async () => {
    const phases = [
      { name: 'Breathe In', duration: 4000 },
      { name: 'Hold', duration: 7000 },
      { name: 'Breathe Out', duration: 8000 },
      { name: 'Rest', duration: 2000 }
    ];

    for (let cycle = 0; cycle < 4; cycle++) {
      setBreathingCount(cycle + 1);
      for (const phase of phases) {
        setBreathingPhase(phase.name);
        await new Promise(resolve => setTimeout(resolve, phase.duration));
      }
    }

    setBreathingPhase('complete');
    setTimeout(() => {
      setBreathingActive(false);
      setBreathingPhase('ready');
      toast.success('Great job! You completed the breathing exercise.');
    }, 2000);
  };

  return (
    <div data-testid="wellness-page" className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground tracking-tight">Wellness Tools</h1>
        <p className="text-foreground/70">Nurture your mental health with AI support and mindfulness</p>
      </div>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger data-testid="chat-tab" value="chat">
            <MessageCircle className="h-4 w-4 mr-2" />
            AI Chat
          </TabsTrigger>
          <TabsTrigger data-testid="quotes-tab" value="quotes">
            <Quote className="h-4 w-4 mr-2" />
            Quotes
          </TabsTrigger>
          <TabsTrigger data-testid="breathing-tab" value="breathing">
            <Wind className="h-4 w-4 mr-2" />
            Breathing
          </TabsTrigger>
        </TabsList>

        {/* AI Chatbot */}
        <TabsContent value="chat" className="space-y-4">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Wellness Companion</CardTitle>
              <CardDescription>
                Share how you're feeling. I'm here to listen and support you.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                data-testid="chat-messages"
                className="h-96 overflow-y-auto space-y-4 p-4 rounded-xl bg-accent/5 border"
              >
                {chatHistory.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-foreground/50">
                    <p>Start a conversation to check in with yourself...</p>
                  </div>
                ) : (
                  chatHistory.map((msg, index) => (
                    <div
                      key={index}
                      data-testid={`chat-message-${index}`}
                      className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-4 rounded-2xl ${
                          msg.type === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card border'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-card border p-4 rounded-2xl">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <form onSubmit={handleChat} className="flex gap-2">
                <Textarea
                  data-testid="chat-input"
                  placeholder="How are you feeling today?"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="rounded-xl resize-none"
                  rows={2}
                />
                <Button
                  data-testid="chat-send-btn"
                  type="submit"
                  disabled={loading || !chatMessage.trim()}
                  className="rounded-full px-6"
                >
                  Send
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Positive Quotes */}
        <TabsContent value="quotes" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quotes.map((quote, index) => (
              <Card
                key={quote.id}
                data-testid={`quote-card-${index}`}
                className="rounded-2xl transition-all hover:shadow-md hover:-translate-y-1"
              >
                <CardContent className="p-6">
                  <blockquote className="space-y-4">
                    <p className="text-lg italic text-foreground leading-relaxed" style={{ fontFamily: 'Playfair Display' }}>
                      "{quote.text}"
                    </p>
                    <footer className="text-sm text-foreground/60">
                      — {quote.author}
                    </footer>
                    <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      {quote.category}
                    </div>
                  </blockquote>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Breathing Exercise */}
        <TabsContent value="breathing">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>4-7-8 Breathing Exercise</CardTitle>
              <CardDescription>
                A powerful technique to calm your mind and reduce stress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 space-y-8">
                {!breathingActive ? (
                  <>
                    <div className="text-center space-y-4">
                      <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center">
                        <Wind className="h-16 w-16 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold">Ready to begin?</h3>
                        <p className="text-sm text-foreground/70 max-w-md">
                          Find a comfortable position. We'll guide you through 4 cycles of calming breaths.
                        </p>
                      </div>
                    </div>
                    <Button
                      data-testid="start-breathing-btn"
                      size="lg"
                      onClick={startBreathingExercise}
                      className="rounded-full px-8"
                    >
                      Start Exercise
                    </Button>
                  </>
                ) : (
                  <div className="text-center space-y-8">
                    <div
                      className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-1000 ${
                        breathingPhase === 'Breathe In'
                          ? 'scale-125 bg-primary/30'
                          : breathingPhase === 'Hold'
                          ? 'scale-125 bg-primary/40'
                          : breathingPhase === 'Breathe Out'
                          ? 'scale-100 bg-primary/20'
                          : breathingPhase === 'complete'
                          ? 'scale-110 bg-primary/30'
                          : 'scale-100 bg-primary/10'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary">
                          {breathingPhase === 'complete' ? '✓' : breathingPhase}
                        </div>
                        <div className="text-sm text-foreground/70 mt-2">
                          {breathingPhase !== 'complete' && `Cycle ${breathingCount}/4`}
                        </div>
                      </div>
                    </div>
                    {breathingPhase === 'complete' && (
                      <p className="text-lg text-foreground">Exercise complete! Well done.</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Wellness;