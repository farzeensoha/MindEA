import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import axios from 'axios';
import { API } from '@/utils/api';
import { toast } from 'sonner';
import { Heart, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const Community = () => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${API}/community/posts`);
      setPosts(response.data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    setLoading(true);
    try {
      await axios.post(`${API}/community/posts`, {
        content: newPost,
        is_anonymous: true
      });
      toast.success('Hope Note shared successfully!');
      setNewPost('');
      setDialogOpen(false);
      fetchPosts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await axios.post(`${API}/community/posts/${postId}/like`);
      fetchPosts();
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleDelete = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await axios.delete(`${API}/community/posts/${postId}`);
      toast.success('Post deleted successfully');
      fetchPosts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete post');
    }
  };

  return (
    <div data-testid="community-page" className="space-y-8">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">Hope Notes</h1>
          <p className="text-foreground/70">Share and discover anonymous messages of support and encouragement</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="create-post-btn" className="rounded-full" size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Share Hope
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Share a Hope Note</DialogTitle>
              <DialogDescription>
                Your message will be anonymous and help others feel less alone.
                Our AI filters ensure this remains a positive, safe space.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <Textarea
                data-testid="new-post-input"
                placeholder="Share something positive, encouraging, or hopeful..."
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="rounded-xl min-h-32 resize-none"
                maxLength={500}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-foreground/50">{newPost.length}/500</span>
                <Button
                  data-testid="submit-post-btn"
                  type="submit"
                  disabled={loading || !newPost.trim()}
                  className="rounded-full"
                >
                  {loading ? 'Sharing...' : 'Share Note'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Community Image */}
      <div className="relative h-64 rounded-2xl overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1655720359248-eeace8c709c5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwyfHxkaXZlcnNlJTIwZ3JvdXAlMjBzdXBwb3J0JTIwY29tbXVuaXR5JTIwaGFwcHl8ZW58MHx8fHwxNzY0NDA3NTAzfDA&ixlib=rb-4.1.0&q=85"
          alt="Community support"
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
        <div className="absolute bottom-6 left-6 text-foreground">
          <h2 className="text-2xl font-bold">Together We Heal</h2>
          <p className="text-foreground/80">A safe space for positive connections</p>
        </div>
      </div>

      {/* Masonry Grid */}
      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {posts.map((post, index) => (
          <Card
            key={post.id}
            data-testid={`community-post-${index}`}
            className="rounded-2xl break-inside-avoid transition-all hover:shadow-md hover:-translate-y-1"
          >
            <CardContent className="p-6">
              <p className="text-foreground leading-relaxed mb-4">{post.content}</p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-foreground/50">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </span>
                <div className="flex gap-2">
                  <Button
                    data-testid={`like-post-btn-${index}`}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(post.id)}
                    className="rounded-full"
                  >
                    <Heart className="h-4 w-4 mr-1" />
                    {post.likes}
                  </Button>
                  <Button
                    data-testid={`delete-post-btn-${index}`}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(post.id)}
                    className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-foreground/50">No Hope Notes yet. Be the first to share!</p>
        </div>
      )}
    </div>
  );
};

export default Community;