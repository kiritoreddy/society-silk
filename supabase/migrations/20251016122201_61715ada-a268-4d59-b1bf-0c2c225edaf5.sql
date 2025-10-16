-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create societies table
CREATE TABLE public.societies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  registration_number TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  financial_year_start DATE NOT NULL DEFAULT '2024-04-01',
  opening_cash DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.societies ENABLE ROW LEVEL SECURITY;

-- Create society_users junction table for multi-society access
CREATE TABLE public.society_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'accountant', 'viewer', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(society_id, user_id)
);

ALTER TABLE public.society_users ENABLE ROW LEVEL SECURITY;

-- Society users policies
CREATE POLICY "Users can view their society memberships"
  ON public.society_users FOR SELECT
  USING (auth.uid() = user_id);

-- Societies policies (users can view societies they belong to)
CREATE POLICY "Users can view their societies"
  ON public.societies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.society_users
      WHERE society_users.society_id = societies.id
      AND society_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Society admins can update their society"
  ON public.societies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.society_users
      WHERE society_users.society_id = societies.id
      AND society_users.user_id = auth.uid()
      AND society_users.role = 'admin'
    )
  );

CREATE POLICY "Users can create societies"
  ON public.societies FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Create members table
CREATE TABLE public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  member_number TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(society_id, member_number)
);

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view members in their societies"
  ON public.members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.society_users
      WHERE society_users.society_id = members.society_id
      AND society_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Accountants can manage members"
  ON public.members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.society_users
      WHERE society_users.society_id = members.society_id
      AND society_users.user_id = auth.uid()
      AND society_users.role IN ('admin', 'accountant')
    )
  );

-- Create account heads table (Chart of Accounts)
CREATE TABLE public.account_heads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'income', 'expense')),
  parent_id UUID REFERENCES public.account_heads(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(society_id, code)
);

ALTER TABLE public.account_heads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view account heads in their societies"
  ON public.account_heads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.society_users
      WHERE society_users.society_id = account_heads.society_id
      AND society_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Accountants can manage account heads"
  ON public.account_heads FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.society_users
      WHERE society_users.society_id = account_heads.society_id
      AND society_users.user_id = auth.uid()
      AND society_users.role IN ('admin', 'accountant')
    )
  );

-- Create vouchers table
CREATE TABLE public.vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  voucher_number TEXT NOT NULL,
  society_voucher_number TEXT,
  voucher_date DATE NOT NULL DEFAULT CURRENT_DATE,
  narration TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'verified', 'approved', 'posted')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(society_id, voucher_number)
);

ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view vouchers in their societies"
  ON public.vouchers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.society_users
      WHERE society_users.society_id = vouchers.society_id
      AND society_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Accountants can manage vouchers"
  ON public.vouchers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.society_users
      WHERE society_users.society_id = vouchers.society_id
      AND society_users.user_id = auth.uid()
      AND society_users.role IN ('admin', 'accountant')
    )
  );

-- Create voucher lines table
CREATE TABLE public.voucher_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
  line_type TEXT NOT NULL CHECK (line_type IN ('receipt', 'payment')),
  account_head_id UUID NOT NULL REFERENCES public.account_heads(id),
  member_id UUID REFERENCES public.members(id),
  particulars TEXT NOT NULL,
  cash_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  transfer_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.voucher_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view voucher lines in their societies"
  ON public.voucher_lines FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vouchers v
      JOIN public.society_users su ON su.society_id = v.society_id
      WHERE v.id = voucher_lines.voucher_id
      AND su.user_id = auth.uid()
    )
  );

CREATE POLICY "Accountants can manage voucher lines"
  ON public.voucher_lines FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.vouchers v
      JOIN public.society_users su ON su.society_id = v.society_id
      WHERE v.id = voucher_lines.voucher_id
      AND su.user_id = auth.uid()
      AND su.role IN ('admin', 'accountant')
    )
  );

-- Create trigger for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to auto-assign user to society
CREATE OR REPLACE FUNCTION public.handle_new_society()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.society_users (society_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_society_created
  AFTER INSERT ON public.societies
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_society();

-- Insert default account heads function
CREATE OR REPLACE FUNCTION public.create_default_account_heads(p_society_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.account_heads (society_id, code, name, type) VALUES
    (p_society_id, 'CASH', 'Cash in Hand', 'asset'),
    (p_society_id, 'BANK', 'Bank Account', 'asset'),
    (p_society_id, 'LOAN-REC', 'Loans Receivable', 'asset'),
    (p_society_id, 'LOAN-PAY', 'Loans Payable', 'liability'),
    (p_society_id, 'BORROW', 'Borrowings', 'liability'),
    (p_society_id, 'INT-INC', 'Interest Income', 'income'),
    (p_society_id, 'SALES', 'Sales/Revenue', 'income'),
    (p_society_id, 'INT-EXP', 'Interest Expense', 'expense'),
    (p_society_id, 'PURCHASE', 'Purchases', 'expense'),
    (p_society_id, 'ADMIN', 'Administrative Expenses', 'expense');
END;
$$;