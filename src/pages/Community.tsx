import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Heart, Plus, Send, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useUser } from '@/contexts/UserContext';

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Conversation {
  id: string;
  user_id: string;
  title: string;
  content: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profiles?: Profile;
}

interface Comment {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  likes_count: number;
  created_at: string;
  profiles?: Profile;
}

export default function Community() {
  const { toast } = useToast();
  const { user: currentUser, profile } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [showNewPost, setShowNewPost] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchConversations();
    setupRealtimeSubscriptions();
  }, []);


  const fetchConversations = async () => {
    try {
      const { data: conversationsData, error } = await supabase
        .from('conversations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately to avoid relationship issues
      const userIds = conversationsData?.map(c => c.user_id) || [];
      
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, user_id, display_name, avatar_url')
          .in('user_id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        }

        // Combine data
        const conversationsWithProfiles = conversationsData?.map(conversation => ({
          ...conversation,
          profiles: profilesData?.find(p => p.user_id === conversation.user_id)
        })) || [];

        setConversations(conversationsWithProfiles);
      } else {
        setConversations([]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (conversationId: string) => {
    try {
      const { data: commentsData, error } = await supabase
        .from('comments')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch profiles separately to avoid relationship issues
      const userIds = commentsData?.map(c => c.user_id) || [];
      
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, user_id, display_name, avatar_url')
          .in('user_id', userIds);

        if (profilesError) {
          console.error('Error fetching comment profiles:', profilesError);
        }

        // Combine data
        const commentsWithProfiles = commentsData?.map(comment => ({
          ...comment,
          profiles: profilesData?.find(p => p.user_id === comment.user_id)
        })) || [];

        setComments(commentsWithProfiles);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to conversations changes
    const conversationsChannel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        () => fetchConversations()
      )
      .subscribe();

    // Subscribe to comments changes
    const commentsChannel = supabase
      .channel('comments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments'
        },
        (payload) => {
          if (selectedConversation && 
              'new' in payload && 
              payload.new && 
              typeof payload.new === 'object' && 
              'conversation_id' in payload.new && 
              payload.new.conversation_id === selectedConversation) {
            fetchComments(selectedConversation);
          }
        }
      )
      .subscribe();

    // Subscribe to likes changes
    const likesChannel = supabase
      .channel('likes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes'
        },
        () => {
          fetchConversations();
          if (selectedConversation) {
            fetchComments(selectedConversation);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(likesChannel);
    };
  };

  const createConversation = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('conversations')
        .insert({
          title: newTitle,
          content: newContent,
          user_id: currentUser?.id
        });

      if (error) throw error;

      setNewTitle('');
      setNewContent('');
      setShowNewPost(false);
      
      toast({
        title: "Success",
        description: "Conversation created successfully!"
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive"
      });
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !selectedConversation) return;

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          conversation_id: selectedConversation,
          content: newComment,
          user_id: currentUser?.id
        });

      if (error) throw error;

      setNewComment('');
      
      toast({
        title: "Success",
        description: "Comment added successfully!"
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Comment deleted successfully!"
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive"
      });
    }
  };

  const toggleLike = async (conversationId: string) => {
    try {
      // Check if user already liked this conversation
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', currentUser?.id)
        .eq('conversation_id', conversationId)
        .maybeSingle();

      if (existingLike) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('id', existingLike.id);
      } else {
        // Like
        await supabase
          .from('likes')
          .insert({
            user_id: currentUser?.id,
            conversation_id: conversationId
          });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const selectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId);
    fetchComments(conversationId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Community Discussions</h1>
        <Button onClick={() => setShowNewPost(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Post
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="lg:col-span-2 space-y-4">
          {showNewPost && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Discussion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Discussion title..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
                <Textarea
                  placeholder="What would you like to discuss?"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={4}
                />
                <div className="flex gap-2">
                  <Button onClick={createConversation}>Post</Button>
                  <Button variant="outline" onClick={() => setShowNewPost(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {conversations.map((conversation) => (
            <Card 
              key={conversation.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedConversation === conversation.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => selectConversation(conversation.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={conversation.profiles?.avatar_url || undefined} />
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg">{conversation.title}</h3>
                    <p className="text-muted-foreground text-sm mb-2">
                      by {conversation.profiles?.display_name || conversation.profiles?.user_id?.slice(0, 8) || 'Unknown User'} • {' '}
                      {formatDistanceToNow(new Date(conversation.created_at), { addSuffix: true })}
                    </p>
                    <p className="text-gray-700 line-clamp-3">{conversation.content}</p>
                    <div className="flex items-center space-x-4 mt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(conversation.id);
                        }}
                        className="text-muted-foreground hover:text-red-500"
                      >
                        <Heart className="h-4 w-4 mr-1" />
                        {conversation.likes_count}
                      </Button>
                      <Badge variant="secondary">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        {conversation.comments_count} comments
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Selected Conversation Details */}
        <div className="lg:col-span-1">
          {selectedConversation ? (
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Comments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="border-b pb-3 last:border-b-0">
                      <div className="flex items-start space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                          <AvatarFallback>
                            <User className="h-3 w-3" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">
                              {comment.profiles?.display_name || comment.profiles?.user_id?.slice(0, 8) || 'Unknown User'}
                            </p>
                            {comment.user_id === currentUser?.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteComment(comment.id)}
                                className="text-destructive hover:text-destructive h-6 w-6 p-0"
                              >
                                ×
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </p>
                          <p className="text-sm mt-1">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addComment();
                      }
                    }}
                  />
                  <Button size="sm" onClick={addComment}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                Select a conversation to view comments
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}