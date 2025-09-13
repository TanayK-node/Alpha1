-- Create table for published algorithmic strategies
CREATE TABLE public.published_algorithms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  portfolio_id UUID NOT NULL,
  strategy_name TEXT NOT NULL,
  strategy_config JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'stopped')),
  total_trades INTEGER NOT NULL DEFAULT 0,
  total_pnl NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for algorithm execution logs
CREATE TABLE public.algorithm_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  algorithm_id UUID NOT NULL REFERENCES public.published_algorithms(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('BUY', 'SELL')),
  quantity INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  reason TEXT NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.published_algorithms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.algorithm_trades ENABLE ROW LEVEL SECURITY;

-- Create policies for published_algorithms
CREATE POLICY "Users can view their own algorithms" 
ON public.published_algorithms 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own algorithms" 
ON public.published_algorithms 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own algorithms" 
ON public.published_algorithms 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own algorithms" 
ON public.published_algorithms 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for algorithm_trades
CREATE POLICY "Users can view their algorithm trades" 
ON public.algorithm_trades 
FOR SELECT 
USING (auth.uid() = (SELECT user_id FROM public.published_algorithms WHERE id = algorithm_trades.algorithm_id));

CREATE POLICY "System can create algorithm trades" 
ON public.algorithm_trades 
FOR INSERT 
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_published_algorithms_updated_at
BEFORE UPDATE ON public.published_algorithms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();