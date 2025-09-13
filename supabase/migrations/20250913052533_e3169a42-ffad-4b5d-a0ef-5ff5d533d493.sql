-- Fix function search path issues
CREATE OR REPLACE FUNCTION public.update_conversation_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.conversation_id IS NOT NULL THEN
      UPDATE public.conversations 
      SET comments_count = comments_count + 1 
      WHERE id = NEW.conversation_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.conversation_id IS NOT NULL THEN
      UPDATE public.conversations 
      SET comments_count = comments_count - 1 
      WHERE id = OLD.conversation_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix function search path issues
CREATE OR REPLACE FUNCTION public.update_like_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.conversation_id IS NOT NULL THEN
      UPDATE public.conversations 
      SET likes_count = likes_count + 1 
      WHERE id = NEW.conversation_id;
    ELSIF NEW.comment_id IS NOT NULL THEN
      UPDATE public.comments 
      SET likes_count = likes_count + 1 
      WHERE id = NEW.comment_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.conversation_id IS NOT NULL THEN
      UPDATE public.conversations 
      SET likes_count = likes_count - 1 
      WHERE id = OLD.conversation_id;
    ELSIF OLD.comment_id IS NOT NULL THEN
      UPDATE public.comments 
      SET likes_count = likes_count - 1 
      WHERE id = OLD.comment_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;