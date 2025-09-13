-- 1) Ensure RLS is enabled on core tables (was disabled in recent logs)
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 2) Recreate portfolio creation function with proper privileges
CREATE OR REPLACE FUNCTION public.create_portfolio_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create a starter portfolio for the newly registered user
  INSERT INTO public.portfolios (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- 3) Create trigger on auth.users to invoke function on signup (id = new user's UUID)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'on_auth_user_created_create_portfolio'
  ) THEN
    CREATE TRIGGER on_auth_user_created_create_portfolio
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_portfolio_for_new_user();
  END IF;
END;
$$;

-- 4) Keep updated_at columns in sync automatically
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_portfolios_updated_at'
  ) THEN
    CREATE TRIGGER trg_update_portfolios_updated_at
    BEFORE UPDATE ON public.portfolios
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_positions_updated_at'
  ) THEN
    CREATE TRIGGER trg_update_positions_updated_at
    BEFORE UPDATE ON public.positions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END;
$$;