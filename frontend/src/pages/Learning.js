import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import axios from 'axios';
import { API } from '@/utils/api';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, RotateCcw, Upload } from 'lucide-react';

const Learning = () => {
  const [flashcards, setFlashcards] = useState([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [topic, setTopic] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchFlashcards();
  }, []);

  const fetchFlashcards = async () => {
    try {
      const response = await axios.get(`${API}/learning/flashcards`);
      setFlashcards(response.data);
    } catch (error) {
      console.error('Failed to fetch flashcards:', error);
    }
  };

  const handleGenerateFromText = async (e) => {
    e.preventDefault();
    if (!topic.trim() || !content.trim()) return;

    setLoading(true);
    try {
      const response = await axios.post(`${API}/learning/flashcards/generate`, {
        topic,
        content
      });
      toast.success(`Generated ${response.data.count} flashcards!`);
      setTopic('');
      setContent('');
      fetchFlashcards();
    } catch (error) {
      toast.error('Failed to generate flashcards');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('topic', topic || file.name);

    setLoading(true);
    try {
      const response = await axios.post(`${API}/learning/flashcards/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(`Generated ${response.data.count} flashcards from file!`);
      setTopic('');
      setFile(null);
      fetchFlashcards();
    } catch (error) {
      toast.error('Failed to process file');
    } finally {
      setLoading(false);
    }
  };

  const nextCard = () => {
    setFlipped(false);
    setCurrentCard((prev) => (prev + 1) % flashcards.length);
  };

  const prevCard = () => {
    setFlipped(false);
    setCurrentCard((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const handleDeleteFlashcard = async () => {
    if (!confirm('Are you sure you want to delete this flashcard?')) return;
    
    try {
      await axios.delete(`${API}/learning/flashcards/${flashcards[currentCard].id}`);
      toast.success('Flashcard deleted successfully');
      await fetchFlashcards();
      setCurrentCard(0);
      setFlipped(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete flashcard');
    }
  };

  return (
    <div data-testid="learning-page" className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground tracking-tight">Learning Module</h1>
        <p className="text-foreground/70">Transform any topic into bite-sized, swipeable flashcards</p>
      </div>

      <Tabs defaultValue="learn" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger data-testid="learn-tab" value="learn">Learn</TabsTrigger>
          <TabsTrigger data-testid="create-tab" value="create">Create</TabsTrigger>
        </TabsList>

        {/* Learning View - Reels Style */}
        <TabsContent value="learn" className="space-y-4">
          {flashcards.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="p-12 text-center">
                <div className="space-y-4">
                  <div className="w-24 h-24 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
                    <Upload className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">No Flashcards Yet</h3>
                  <p className="text-foreground/70">Create your first set to start learning!</p>
                  <Button
                    data-testid="go-to-create-btn"
                    onClick={() => document.querySelector('[value="create"]').click()}
                    className="rounded-full"
                  >
                    Create Flashcards
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center space-y-6">
              {/* Flashcard */}
              <div
                data-testid="flashcard-container"
                className="w-full max-w-md h-[70vh] perspective-1000"
                onClick={() => setFlipped(!flipped)}
              >
                <div
                  className={`relative w-full h-full transition-transform duration-500 transform-style-3d cursor-pointer ${
                    flipped ? 'rotate-y-180' : ''
                  }`}
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                  }}
                >
                  {/* Front */}
                  <div
                    className="absolute inset-0 rounded-3xl shadow-xl overflow-hidden backface-hidden"
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden'
                    }}
                  >
                    <div
                      className="w-full h-full bg-gradient-to-br from-primary/20 via-accent/20 to-transparent p-8 flex flex-col justify-between"
                      style={{
                        backgroundImage: `url('https://images.unsplash.com/photo-1756759327800-2da04ec2545c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMGZsb3clMjBmb2N1cyUyMGxlYXJuaW5nJTIwZ3Jvd3RofGVufDB8fHx8MTc2NDQwNzUwNHww&ixlib=rb-4.1.0&q=85')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      <div className="bg-white/90 dark:bg-black/80 backdrop-blur-xl rounded-2xl p-6 border">
                        <div className="text-xs font-mono uppercase tracking-widest text-foreground/50 mb-2">
                          Question
                        </div>
                        <p className="text-2xl font-semibold text-foreground leading-relaxed">
                          {flashcards[currentCard]?.question}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-foreground/70 bg-white/70 dark:bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full inline-block">
                          Tap to reveal answer
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Back */}
                  <div
                    className="absolute inset-0 rounded-3xl shadow-xl overflow-hidden backface-hidden"
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)'
                    }}
                  >
                    <div
                      className="w-full h-full bg-gradient-to-br from-accent/20 via-primary/20 to-transparent p-8 flex flex-col justify-between"
                      style={{
                        backgroundImage: `url('https://images.unsplash.com/photo-1756759327800-2da04ec2545c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMGZsb3clMjBmb2N1cyUyMGxlYXJuaW5nJTIwZ3Jvd3RofGVufDB8fHx8MTc2NDQwNzUwNHww&ixlib=rb-4.1.0&q=85')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      <div className="bg-white/90 dark:bg-black/80 backdrop-blur-xl rounded-2xl p-6 border">
                        <div className="text-xs font-mono uppercase tracking-widest text-foreground/50 mb-2">
                          Answer
                        </div>
                        <p className="text-xl text-foreground leading-relaxed">
                          {flashcards[currentCard]?.answer}
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="inline-block px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium">
                          {flashcards[currentCard]?.topic}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4">
                <Button
                  data-testid="prev-card-btn"
                  variant="outline"
                  size="icon"
                  onClick={prevCard}
                  className="rounded-full h-12 w-12"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <div className="text-sm text-foreground/70">
                  {currentCard + 1} / {flashcards.length}
                </div>
                <Button
                  data-testid="flip-card-btn"
                  variant="outline"
                  size="icon"
                  onClick={() => setFlipped(!flipped)}
                  className="rounded-full h-12 w-12"
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
                <Button
                  data-testid="next-card-btn"
                  variant="outline"
                  size="icon"
                  onClick={nextCard}
                  className="rounded-full h-12 w-12"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
                <Button
                  data-testid="delete-card-btn"
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteFlashcard}
                  className="rounded-full"
                >
                  Delete Card
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Create Flashcards */}
        <TabsContent value="create" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Text Input */}
            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <form onSubmit={handleGenerateFromText} className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">From Text</h3>
                    <p className="text-sm text-foreground/70">Paste your study material</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="topic">Topic</Label>
                    <Input
                      id="topic"
                      data-testid="topic-input"
                      placeholder="e.g., World History"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      data-testid="content-input"
                      placeholder="Paste your study notes, article, or any text..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="rounded-xl min-h-48 resize-none"
                    />
                  </div>
                  <Button
                    data-testid="generate-text-btn"
                    type="submit"
                    disabled={loading || !topic || !content}
                    className="w-full rounded-full"
                  >
                    {loading ? 'Generating...' : 'Generate Flashcards'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* File Upload */}
            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <form onSubmit={handleFileUpload} className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">From File</h3>
                    <p className="text-sm text-foreground/70">Upload a text file</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="file-topic">Topic (Optional)</Label>
                    <Input
                      id="file-topic"
                      data-testid="file-topic-input"
                      placeholder="Auto-detected from filename"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="file">File</Label>
                    <Input
                      id="file"
                      data-testid="file-input"
                      type="file"
                      accept=".txt,.md"
                      onChange={(e) => setFile(e.target.files[0])}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="border-2 border-dashed rounded-xl p-8 text-center">
                    <Upload className="h-12 w-12 text-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-foreground/50">
                      {file ? file.name : 'Drag and drop or click to upload'}
                    </p>
                  </div>
                  <Button
                    data-testid="generate-file-btn"
                    type="submit"
                    disabled={loading || !file}
                    className="w-full rounded-full"
                  >
                    {loading ? 'Processing...' : 'Generate from File'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Learning;