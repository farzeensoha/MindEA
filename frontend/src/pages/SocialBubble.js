import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { API } from '@/utils/api';
import { toast } from 'sonner';
import { Users, Plus, MessageCircle, Award, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const SocialBubble = () => {
  const [bubbles, setBubbles] = useState([]);
  const [selectedBubble, setSelectedBubble] = useState(null);
  const [bubblePosts, setBubblePosts] = useState([]);
  const [newBubbleName, setNewBubbleName] = useState('');
  const [newBubbleDescription, setNewBubbleDescription] = useState('');
  const [newPostCaption, setNewPostCaption] = useState('');
  const [newPostImage, setNewPostImage] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [incomingInvites, setIncomingInvites] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [myCompletions, setMyCompletions] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [postDialogOpen, setPostDialogOpen] = useState(false);

  useEffect(() => {
    fetchBubbles();
    fetchCurrentChallenge();
    fetchMyCompletions();
    fetchInvites();
  }, []);

  useEffect(() => {
    if (selectedBubble) {
      fetchBubblePosts(selectedBubble.id);
    }
  }, [selectedBubble]);

  const fetchBubbles = async () => {
    try {
      const response = await axios.get(`${API}/bubbles`);
      setBubbles(response.data);
      if (response.data.length > 0 && !selectedBubble) {
        setSelectedBubble(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch bubbles:', error);
    }
  };

  const fetchBubblePosts = async (bubbleId) => {
    try {
      const response = await axios.get(`${API}/bubbles/${bubbleId}/posts`);
      setBubblePosts(response.data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    }
  };

  const fetchCurrentChallenge = async () => {
    try {
      const response = await axios.get(`${API}/challenges/current`);
      setCurrentChallenge(response.data);
    } catch (error) {
      console.error('Failed to fetch challenge:', error);
    }
  };

  const fetchMyCompletions = async () => {
    try {
      const response = await axios.get(`${API}/challenges/my-completions`);
      setMyCompletions(response.data);
    } catch (error) {
      console.error('Failed to fetch completions:', error);
    }
  };

  const fetchInvites = async () => {
    try {
      const response = await axios.get(`${API}/bubbles/invites`);
      setIncomingInvites(response.data);
    } catch (error) {
      console.error('Failed to fetch invites:', error);
    }
  };

  const handleLocalImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();

    reader.onload = () => {
      setNewPostImage(reader.result.toString());
    };
    reader.readAsDataURL(file);
  };

  const handleCreateBubble = async (e) => {
    e.preventDefault();
    if (!newBubbleName.trim()) return;

    try {
      await axios.post(`${API}/bubbles`, {
        name: newBubbleName,
        description: newBubbleDescription
      });
      toast.success('Bubble created successfully!');
      setNewBubbleName('');
      setNewBubbleDescription('');
      setCreateDialogOpen(false);
      fetchBubbles();
    } catch (error) {
      toast.error('Failed to create bubble');
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostCaption.trim()) return;

    try {
      await axios.post(`${API}/bubbles/posts`, {
        bubble_id: selectedBubble.id,
        caption: newPostCaption,
        image_url: newPostImage || null
      });
      toast.success('Posted successfully!');
      setNewPostCaption('');
      setNewPostImage('');
      setPostDialogOpen(false);
      fetchBubblePosts(selectedBubble.id);
      fetchMyCompletions();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create post');
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;

    try {
      await axios.post(`${API}/bubbles/invite`, {
        bubble_id: selectedBubble.id,
        invitee_email: inviteEmail,
        message: inviteMessage.trim() || undefined
      });
      toast.success(`Invited ${inviteEmail} to your bubble!`);
      setInviteEmail('');
      setInviteMessage('');
      fetchInvites();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send invite');
    }
  };

  const handleInviteResponse = async (inviteId, accept) => {
    try {
      await axios.post(`${API}/bubbles/invites/${inviteId}/respond`, { accept });
      toast.success(accept ? 'Invite accepted' : 'Invite rejected');
      fetchInvites();
      fetchBubbles();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to respond to invite');
    }
  };

  const handleReply = async (postId) => {
    if (!replyText.trim()) return;

    try {
      await axios.post(`${API}/bubbles/posts/${postId}/reply`, {
        text: replyText
      });
      toast.success('Reply sent!');
      setReplyText('');
      setReplyingTo(null);
      fetchBubblePosts(selectedBubble.id);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send reply');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await axios.delete(`${API}/bubbles/posts/${postId}`);
      toast.success('Post deleted successfully');
      fetchBubblePosts(selectedBubble.id);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete post');
    }
  };

  return (
    <div data-testid="social-bubble-page" className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">Social Bubble</h1>
          <p className="text-foreground/70">Your private, positive social circles</p>
        </div>
        <div className="flex gap-3">
          {myCompletions && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Award className="h-5 w-5 text-primary" />
              <span className="font-semibold text-primary">{myCompletions.total_tokens} tokens</span>
            </div>
          )}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="create-bubble-btn" className="rounded-full">
                <Plus className="h-4 w-4 mr-2" />
                New Bubble
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>Create a New Bubble</DialogTitle>
                <DialogDescription>Create your own private social circle</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateBubble} className="space-y-4">
                <Input
                  data-testid="bubble-name-input"
                  placeholder="Bubble name"
                  value={newBubbleName}
                  onChange={(e) => setNewBubbleName(e.target.value)}
                  className="rounded-xl"
                  required
                />
                <Textarea
                  data-testid="bubble-description-input"
                  placeholder="Description"
                  value={newBubbleDescription}
                  onChange={(e) => setNewBubbleDescription(e.target.value)}
                  className="rounded-xl resize-none"
                  rows={3}
                />
                <Button type="submit" className="w-full rounded-full" data-testid="submit-bubble-btn">
                  Create Bubble
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {currentChallenge && (
        <Card className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2 text-foreground">This Week's Challenge</h3>
                <h4 className="text-lg font-medium text-primary mb-1">{currentChallenge.title}</h4>
                <p className="text-foreground/70 mb-3">{currentChallenge.description}</p>
                <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                  Use {currentChallenge.tag} in your post
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="rounded-2xl lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              My Bubbles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {bubbles.map((bubble) => (
              <div
                key={bubble.id}
                data-testid={`bubble-item-${bubble.id}`}
                className={`p-4 rounded-xl cursor-pointer transition-all ${
                  selectedBubble?.id === bubble.id
                    ? 'bg-primary/10 border-2 border-primary'
                    : 'bg-accent/5 border-2 border-transparent hover:border-accent'
                }`}
                onClick={() => setSelectedBubble(bubble)}
              >
                <h4 className="font-semibold text-foreground">{bubble.name}</h4>
                <p className="text-sm text-foreground/60 line-clamp-1">{bubble.description}</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-foreground/50">
                  <Users className="h-3 w-3" />
                  {bubble.members.length} members
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-6">
          {selectedBubble ? (
            <>
              <Card className="rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground mb-2">{selectedBubble.name}</h2>
                      <p className="text-foreground/70">{selectedBubble.description}</p>
                      <p className="text-sm text-foreground/50 mt-2">{selectedBubble.members.length} members</p>
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="rounded-full" data-testid="invite-btn">
                            Invite
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-2xl">
                          <DialogHeader>
                            <DialogTitle>Invite to Bubble</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Input
                              placeholder="friend@email.com"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              className="rounded-xl"
                            />
                            <Textarea
                              placeholder="Add a personal message (optional)"
                              value={inviteMessage}
                              onChange={(e) => setInviteMessage(e.target.value)}
                              className="rounded-xl resize-none"
                              rows={3}
                            />
                            <Button onClick={handleInvite} className="w-full rounded-full">
                              Send Invite
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Dialog open={postDialogOpen} onOpenChange={setPostDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="rounded-full" data-testid="new-post-btn">
                            <Plus className="h-4 w-4 mr-2" />
                            Post
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-2xl">
                          <DialogHeader>
                            <DialogTitle>Share with Your Bubble</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleCreatePost} className="space-y-4">
                            <Textarea
                              data-testid="post-caption-input"
                              placeholder="What's on your mind?"
                              value={newPostCaption}
                              onChange={(e) => setNewPostCaption(e.target.value)}
                              className="rounded-xl resize-none min-h-32"
                              required
                            />
                            <Input
                              data-testid="post-image-input"
                              placeholder="Image URL (optional)"
                              value={newPostImage && !newPostImage.startsWith('data:') ? newPostImage : ''}
                              onChange={(e) => setNewPostImage(e.target.value)}
                              className="rounded-xl"
                            />
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-foreground">Upload an image from your device</label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleLocalImageUpload}
                                className="w-full text-sm"
                              />
                              {newPostImage && newPostImage.startsWith('data:') && (
                                <div className="rounded-xl overflow-hidden border border-border mt-2">
                                  <img src={newPostImage} alt="Preview" className="w-full h-48 object-cover" />
                                </div>
                              )}
                            </div>
                            <Button type="submit" className="w-full rounded-full" data-testid="submit-post-btn">
                              Share
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {incomingInvites.length > 0 && (
                <Card className="rounded-2xl border border-amber-200 bg-amber-50">
                  <CardHeader>
                    <CardTitle>Pending Invites</CardTitle>
                    <CardDescription>Accept or reject invitations to join new bubbles.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {incomingInvites.map((invite) => (
                      <div key={invite.id} className="p-4 rounded-2xl bg-white/90 border border-amber-100">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <p className="font-semibold text-foreground">Invite from {invite.inviter_name}</p>
                            <p className="text-sm text-foreground/70">Join bubble: {invite.bubble_name}</p>
                            {invite.message && <p className="mt-2 text-sm text-foreground/80">"{invite.message}"</p>}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleInviteResponse(invite.id, true)} className="rounded-full">
                              Accept
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleInviteResponse(invite.id, false)} className="rounded-full">
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                {bubblePosts.length === 0 ? (
                  <Card className="rounded-2xl">
                    <CardContent className="p-12 text-center">
                      <Users className="h-16 w-16 mx-auto text-foreground/20 mb-4" />
                      <h3 className="text-xl font-semibold text-foreground mb-2">No posts yet</h3>
                      <p className="text-foreground/60">Be the first to share in this bubble!</p>
                    </CardContent>
                  </Card>
                ) : (
                  bubblePosts.map((post, index) => (
                    <Card key={post.id} data-testid={`bubble-post-${index}`} className="rounded-2xl">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-foreground">{post.author_name}</h4>
                            <p className="text-sm text-foreground/50">
                              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>

                        {post.image_url && (
                          <div className="rounded-xl overflow-hidden">
                            <img
                              src={post.image_url}
                              alt="Post"
                              className="w-full h-64 object-cover"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          </div>
                        )}

                        <p className="text-foreground leading-relaxed">{post.caption}</p>

                        {post.replies && post.replies.length > 0 && (
                          <div className="space-y-3 pt-4 border-t">
                            <p className="text-sm font-medium text-foreground/70">
                              Supportive replies ({post.replies.length})
                            </p>
                            {post.replies.map((reply) => (
                              <div key={reply.id} className="p-3 rounded-xl bg-accent/5">
                                <p className="text-sm font-medium text-foreground">{reply.author_name}</p>
                                <p className="text-sm text-foreground/80 mt-1">{reply.text}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {replyingTo === post.id ? (
                          <div className="space-y-2 pt-4 border-t">
                            <Textarea
                              placeholder="Write a supportive reply..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              className="rounded-xl resize-none"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleReply(post.id)}
                                className="rounded-full"
                                size="sm"
                              >
                                Send
                              </Button>
                              <Button
                                onClick={() => { setReplyingTo(null); setReplyText(''); }}
                                variant="outline"
                                className="rounded-full"
                                size="sm"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => setReplyingTo(post.id)}
                              variant="ghost"
                              className="rounded-full"
                              size="sm"
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Reply
                            </Button>
                            <Button
                              onClick={() => handleDeletePost(post.id)}
                              variant="ghost"
                              className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                              size="sm"
                            >
                              Delete
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </>
          ) : (
            <Card className="rounded-2xl">
              <CardContent className="p-12 text-center">
                <Users className="h-16 w-16 mx-auto text-foreground/20 mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Select a Bubble</h3>
                <p className="text-foreground/60">Choose a bubble from the list to see posts</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SocialBubble;
