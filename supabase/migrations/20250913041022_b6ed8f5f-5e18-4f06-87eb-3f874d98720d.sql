-- Create tables for paper trading simulation

-- Create portfolios table to track user's paper trading account
CREATE TABLE public.portfolios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cash_balance DECIMAL(15,2) NOT NULL DEFAULT 100000.00,
  total_value DECIMAL(15,2) NOT NULL DEFAULT 100000.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create positions table to track stock holdings
CREATE TABLE public.positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  avg_price DECIMAL(10,4) NOT NULL,
  current_price DECIMAL(10,4) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(portfolio_id, symbol)
);

-- Create transactions table to track all buy/sell activities
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('BUY', 'SELL')),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,4) NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  fees DECIMAL(10,2) NOT NULL DEFAULT 0,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for portfolios
CREATE POLICY "Users can view their own portfolios" 
ON public.portfolios 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own portfolios" 
ON public.portfolios 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolios" 
ON public.portfolios 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for positions
CREATE POLICY "Users can view their own positions" 
ON public.positions 
FOR SELECT 
USING (auth.uid() = (SELECT user_id FROM public.portfolios WHERE id = portfolio_id));

CREATE POLICY "Users can create their own positions" 
ON public.positions 
FOR INSERT 
WITH CHECK (auth.uid() = (SELECT user_id FROM public.portfolios WHERE id = portfolio_id));

CREATE POLICY "Users can update their own positions" 
ON public.positions 
FOR UPDATE 
USING (auth.uid() = (SELECT user_id FROM public.portfolios WHERE id = portfolio_id));

CREATE POLICY "Users can delete their own positions" 
ON public.positions 
FOR DELETE 
USING (auth.uid() = (SELECT user_id FROM public.portfolios WHERE id = portfolio_id));

-- Create RLS policies for transactions
CREATE POLICY "Users can view their own transactions" 
ON public.transactions 
FOR SELECT 
USING (auth.uid() = (SELECT user_id FROM public.portfolios WHERE id = portfolio_id));

CREATE POLICY "Users can create their own transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (auth.uid() = (SELECT user_id FROM public.portfolios WHERE id = portfolio_id));

-- Create function to update portfolio timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_portfolios_updated_at
BEFORE UPDATE ON public.portfolios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_positions_updated_at
BEFORE UPDATE ON public.positions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create portfolio for new users
CREATE OR REPLACE FUNCTION public.create_portfolio_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.portfolios (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-create portfolio when user signs up
CREATE TRIGGER on_auth_user_created_portfolio
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_portfolio_for_new_user();