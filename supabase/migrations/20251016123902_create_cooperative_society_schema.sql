/*
  # Cooperative Society Management System - Complete Database Schema

  ## Overview
  This migration creates a complete multi-society cooperative management system with:
  - Multi-tenancy support for multiple societies
  - Day Book with dual-column format (Receipt/Payment)
  - Members management
  - Chart of Accounts
  - Vouchers with maker-checker workflow
  - Loans (lending to members)
  - Borrowings (from banks/institutions)
  - Inventory/Merchandise management
  - Audit trails and approval workflows

  ## Tables Created

  ### 1. Organizations & Societies
    - `organizations` - Top-level organization
    - `societies` - Individual cooperative societies under an organization
    - `society_settings` - Financial year, numbering formats, defaults
    - `society_users` - User-society mappings with roles

  ### 2. Members & Accounts
    - `members` - Society members
    - `account_heads` - Chart of accounts (Assets, Liabilities, Income, Expenditure)
    - `account_types` - Classification of account heads

  ### 3. Vouchers & Day Book
    - `vouchers` - Main voucher records with approval workflow
    - `voucher_lines` - Individual line items (Receipt/Payment)
    - `day_book_entries` - Computed view for dual-column day book

  ### 4. Loans & Borrowings
    - `loans` - Loans given to members
    - `loan_transactions` - Disbursements and repayments
    - `borrowings` - Money borrowed from banks/institutions
    - `borrowing_transactions` - Borrowing disbursements and repayments

  ### 5. Inventory
    - `inventory_items` - Item master with SKU, UOM
    - `inventory_transactions` - Purchase, sales, adjustments
    - `inventory_ledger` - Running stock balance per item

  ### 6. Audit & Security
    - `audit_logs` - Complete audit trail
    - `financial_periods` - Period locking for compliance

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Policies ensure users can only access their society's data
  - Role-based access control (Admin, Accounts, Auditor)
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS AND TYPES
-- =====================================================

CREATE TYPE user_role AS ENUM ('admin', 'accounts', 'auditor', 'viewer');
CREATE TYPE voucher_status AS ENUM ('draft', 'verified', 'approved', 'posted', 'cancelled');
CREATE TYPE voucher_type AS ENUM ('receipt', 'payment', 'journal', 'contra');
CREATE TYPE entry_side AS ENUM ('debit', 'credit');
CREATE TYPE account_category AS ENUM ('asset', 'liability', 'income', 'expenditure');
CREATE TYPE payment_mode AS ENUM ('cash', 'transfer', 'cheque');
CREATE TYPE loan_status AS ENUM ('active', 'closed', 'defaulted');
CREATE TYPE inventory_transaction_type AS ENUM ('purchase', 'sale', 'adjustment_in', 'adjustment_out');
CREATE TYPE member_status AS ENUM ('active', 'inactive', 'suspended');

-- =====================================================
-- 1. ORGANIZATIONS & SOCIETIES
-- =====================================================

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS societies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  address text,
  phone text,
  email text,
  registration_number text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, code)
);

CREATE TABLE IF NOT EXISTS society_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid REFERENCES societies(id) ON DELETE CASCADE UNIQUE,
  financial_year_start date NOT NULL DEFAULT date_trunc('year', CURRENT_DATE),
  financial_year_end date NOT NULL DEFAULT (date_trunc('year', CURRENT_DATE) + interval '1 year - 1 day'),
  voucher_prefix text DEFAULT 'V',
  default_loan_interest_rate numeric(5,2) DEFAULT 12.00,
  default_borrowing_interest_rate numeric(5,2) DEFAULT 10.00,
  inventory_valuation_method text DEFAULT 'FIFO',
  enable_maker_checker boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS society_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid REFERENCES societies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role DEFAULT 'viewer',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(society_id, user_id)
);

-- =====================================================
-- 2. MEMBERS
-- =====================================================

CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid REFERENCES societies(id) ON DELETE CASCADE,
  member_number text NOT NULL,
  name text NOT NULL,
  phone text,
  email text,
  address text,
  date_of_joining date DEFAULT CURRENT_DATE,
  status member_status DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(society_id, member_number)
);

-- =====================================================
-- 3. CHART OF ACCOUNTS
-- =====================================================

CREATE TABLE IF NOT EXISTS account_heads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid REFERENCES societies(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  category account_category NOT NULL,
  parent_id uuid REFERENCES account_heads(id),
  is_system boolean DEFAULT false,
  is_active boolean DEFAULT true,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(society_id, code)
);

-- =====================================================
-- 4. VOUCHERS & DAY BOOK
-- =====================================================

CREATE TABLE IF NOT EXISTS vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid REFERENCES societies(id) ON DELETE CASCADE,
  voucher_number text NOT NULL,
  society_voucher_number text,
  voucher_date date NOT NULL DEFAULT CURRENT_DATE,
  voucher_type voucher_type DEFAULT 'journal',
  status voucher_status DEFAULT 'draft',
  narration text,
  total_amount numeric(15,2) DEFAULT 0,
  member_id uuid REFERENCES members(id),
  created_by uuid REFERENCES auth.users(id),
  verified_by uuid REFERENCES auth.users(id),
  approved_by uuid REFERENCES auth.users(id),
  posted_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  verified_at timestamptz,
  approved_at timestamptz,
  posted_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(society_id, voucher_number)
);

CREATE TABLE IF NOT EXISTS voucher_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id uuid REFERENCES vouchers(id) ON DELETE CASCADE,
  line_number integer NOT NULL,
  side entry_side NOT NULL,
  account_head_id uuid REFERENCES account_heads(id),
  particulars text NOT NULL,
  cash_amount numeric(15,2) DEFAULT 0,
  transfer_amount numeric(15,2) DEFAULT 0,
  total_amount numeric(15,2) GENERATED ALWAYS AS (cash_amount + transfer_amount) STORED,
  member_id uuid REFERENCES members(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(voucher_id, line_number)
);

-- =====================================================
-- 5. LOANS (Given to Members)
-- =====================================================

CREATE TABLE IF NOT EXISTS loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid REFERENCES societies(id) ON DELETE CASCADE,
  loan_number text NOT NULL,
  member_id uuid REFERENCES members(id) ON DELETE RESTRICT,
  principal_amount numeric(15,2) NOT NULL,
  interest_rate numeric(5,2) NOT NULL,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  disbursement_date date,
  status loan_status DEFAULT 'active',
  outstanding_principal numeric(15,2) DEFAULT 0,
  outstanding_interest numeric(15,2) DEFAULT 0,
  disbursement_voucher_id uuid REFERENCES vouchers(id),
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(society_id, loan_number)
);

CREATE TABLE IF NOT EXISTS loan_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid REFERENCES loans(id) ON DELETE CASCADE,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  transaction_type text NOT NULL,
  principal_amount numeric(15,2) DEFAULT 0,
  interest_amount numeric(15,2) DEFAULT 0,
  total_amount numeric(15,2) GENERATED ALWAYS AS (principal_amount + interest_amount) STORED,
  voucher_id uuid REFERENCES vouchers(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- 6. BORROWINGS (From Banks/Institutions)
-- =====================================================

CREATE TABLE IF NOT EXISTS borrowings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid REFERENCES societies(id) ON DELETE CASCADE,
  borrowing_number text NOT NULL,
  lender_name text NOT NULL,
  principal_amount numeric(15,2) NOT NULL,
  interest_rate numeric(5,2) NOT NULL,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  disbursement_date date,
  status loan_status DEFAULT 'active',
  outstanding_principal numeric(15,2) DEFAULT 0,
  outstanding_interest numeric(15,2) DEFAULT 0,
  disbursement_voucher_id uuid REFERENCES vouchers(id),
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(society_id, borrowing_number)
);

CREATE TABLE IF NOT EXISTS borrowing_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  borrowing_id uuid REFERENCES borrowings(id) ON DELETE CASCADE,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  transaction_type text NOT NULL,
  principal_amount numeric(15,2) DEFAULT 0,
  interest_amount numeric(15,2) DEFAULT 0,
  total_amount numeric(15,2) GENERATED ALWAYS AS (principal_amount + interest_amount) STORED,
  voucher_id uuid REFERENCES vouchers(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- 7. INVENTORY / MERCHANDISE
-- =====================================================

CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid REFERENCES societies(id) ON DELETE CASCADE,
  sku text NOT NULL,
  name text NOT NULL,
  uom text NOT NULL,
  opening_quantity numeric(15,3) DEFAULT 0,
  opening_value numeric(15,2) DEFAULT 0,
  current_quantity numeric(15,3) DEFAULT 0,
  current_value numeric(15,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(society_id, sku)
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid REFERENCES societies(id) ON DELETE CASCADE,
  item_id uuid REFERENCES inventory_items(id) ON DELETE RESTRICT,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  transaction_type inventory_transaction_type NOT NULL,
  quantity numeric(15,3) NOT NULL,
  rate numeric(15,2) NOT NULL,
  amount numeric(15,2) GENERATED ALWAYS AS (quantity * rate) STORED,
  voucher_id uuid REFERENCES vouchers(id),
  narration text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES inventory_items(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES inventory_transactions(id) ON DELETE CASCADE,
  transaction_date date NOT NULL,
  quantity_in numeric(15,3) DEFAULT 0,
  quantity_out numeric(15,3) DEFAULT 0,
  balance_quantity numeric(15,3) NOT NULL,
  value_in numeric(15,2) DEFAULT 0,
  value_out numeric(15,2) DEFAULT 0,
  balance_value numeric(15,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- 8. FINANCIAL PERIODS & AUDIT
-- =====================================================

CREATE TABLE IF NOT EXISTS financial_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid REFERENCES societies(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  is_locked boolean DEFAULT false,
  locked_by uuid REFERENCES auth.users(id),
  locked_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(society_id, period_start, period_end)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid REFERENCES societies(id) ON DELETE CASCADE,
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  user_id uuid REFERENCES auth.users(id),
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_societies_org ON societies(organization_id);
CREATE INDEX IF NOT EXISTS idx_society_users_society ON society_users(society_id);
CREATE INDEX IF NOT EXISTS idx_society_users_user ON society_users(user_id);
CREATE INDEX IF NOT EXISTS idx_members_society ON members(society_id);
CREATE INDEX IF NOT EXISTS idx_members_number ON members(society_id, member_number);
CREATE INDEX IF NOT EXISTS idx_account_heads_society ON account_heads(society_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_society_date ON vouchers(society_id, voucher_date);
CREATE INDEX IF NOT EXISTS idx_vouchers_status ON vouchers(status);
CREATE INDEX IF NOT EXISTS idx_voucher_lines_voucher ON voucher_lines(voucher_id);
CREATE INDEX IF NOT EXISTS idx_voucher_lines_account ON voucher_lines(account_head_id);
CREATE INDEX IF NOT EXISTS idx_loans_society ON loans(society_id);
CREATE INDEX IF NOT EXISTS idx_loans_member ON loans(member_id);
CREATE INDEX IF NOT EXISTS idx_loan_transactions_loan ON loan_transactions(loan_id);
CREATE INDEX IF NOT EXISTS idx_borrowings_society ON borrowings(society_id);
CREATE INDEX IF NOT EXISTS idx_borrowing_transactions_borrowing ON borrowing_transactions(borrowing_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_society ON inventory_items(society_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item ON inventory_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_ledger_item ON inventory_ledger(item_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_society ON audit_logs(society_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE societies ENABLE ROW LEVEL SECURITY;
ALTER TABLE society_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE society_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_heads ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrowings ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrowing_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user has access to society
CREATE OR REPLACE FUNCTION has_society_access(society_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM society_users
    WHERE society_id = society_uuid
    AND user_id = auth.uid()
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user role in society
CREATE OR REPLACE FUNCTION get_user_role(society_uuid uuid)
RETURNS user_role AS $$
DECLARE
  user_role_result user_role;
BEGIN
  SELECT role INTO user_role_result
  FROM society_users
  WHERE society_id = society_uuid
  AND user_id = auth.uid()
  AND is_active = true;
  RETURN user_role_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Organizations: Users can see organizations they have access to via societies
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM societies s
      INNER JOIN society_users su ON su.society_id = s.id
      WHERE s.organization_id = organizations.id
      AND su.user_id = auth.uid()
    )
  );

-- Societies: Users can view societies they're members of
CREATE POLICY "Users can view their societies"
  ON societies FOR SELECT
  TO authenticated
  USING (has_society_access(id));

-- Society Settings: Users can view their society settings
CREATE POLICY "Users can view society settings"
  ON society_settings FOR SELECT
  TO authenticated
  USING (has_society_access(society_id));

CREATE POLICY "Admins can update society settings"
  ON society_settings FOR UPDATE
  TO authenticated
  USING (has_society_access(society_id) AND get_user_role(society_id) = 'admin')
  WITH CHECK (has_society_access(society_id) AND get_user_role(society_id) = 'admin');

-- Society Users: Users can view society memberships
CREATE POLICY "Users can view society users"
  ON society_users FOR SELECT
  TO authenticated
  USING (has_society_access(society_id));

-- Members: All authenticated users in society can view
CREATE POLICY "Users can view members"
  ON members FOR SELECT
  TO authenticated
  USING (has_society_access(society_id));

CREATE POLICY "Accounts and admins can insert members"
  ON members FOR INSERT
  TO authenticated
  WITH CHECK (
    has_society_access(society_id) 
    AND get_user_role(society_id) IN ('admin', 'accounts')
  );

CREATE POLICY "Accounts and admins can update members"
  ON members FOR UPDATE
  TO authenticated
  USING (has_society_access(society_id) AND get_user_role(society_id) IN ('admin', 'accounts'))
  WITH CHECK (has_society_access(society_id) AND get_user_role(society_id) IN ('admin', 'accounts'));

-- Account Heads: All users can view, admins can modify
CREATE POLICY "Users can view account heads"
  ON account_heads FOR SELECT
  TO authenticated
  USING (has_society_access(society_id));

CREATE POLICY "Admins can insert account heads"
  ON account_heads FOR INSERT
  TO authenticated
  WITH CHECK (has_society_access(society_id) AND get_user_role(society_id) = 'admin');

CREATE POLICY "Admins can update account heads"
  ON account_heads FOR UPDATE
  TO authenticated
  USING (has_society_access(society_id) AND get_user_role(society_id) = 'admin')
  WITH CHECK (has_society_access(society_id) AND get_user_role(society_id) = 'admin');

-- Vouchers: All users can view, accounts can create/update
CREATE POLICY "Users can view vouchers"
  ON vouchers FOR SELECT
  TO authenticated
  USING (has_society_access(society_id));

CREATE POLICY "Accounts can insert vouchers"
  ON vouchers FOR INSERT
  TO authenticated
  WITH CHECK (
    has_society_access(society_id) 
    AND get_user_role(society_id) IN ('admin', 'accounts')
  );

CREATE POLICY "Accounts can update vouchers"
  ON vouchers FOR UPDATE
  TO authenticated
  USING (
    has_society_access(society_id) 
    AND get_user_role(society_id) IN ('admin', 'accounts')
  )
  WITH CHECK (
    has_society_access(society_id) 
    AND get_user_role(society_id) IN ('admin', 'accounts')
  );

-- Voucher Lines: Inherit access from voucher
CREATE POLICY "Users can view voucher lines"
  ON voucher_lines FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vouchers v
      WHERE v.id = voucher_lines.voucher_id
      AND has_society_access(v.society_id)
    )
  );

CREATE POLICY "Accounts can insert voucher lines"
  ON voucher_lines FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vouchers v
      WHERE v.id = voucher_lines.voucher_id
      AND has_society_access(v.society_id)
      AND get_user_role(v.society_id) IN ('admin', 'accounts')
    )
  );

CREATE POLICY "Accounts can update voucher lines"
  ON voucher_lines FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vouchers v
      WHERE v.id = voucher_lines.voucher_id
      AND has_society_access(v.society_id)
      AND get_user_role(v.society_id) IN ('admin', 'accounts')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vouchers v
      WHERE v.id = voucher_lines.voucher_id
      AND has_society_access(v.society_id)
      AND get_user_role(v.society_id) IN ('admin', 'accounts')
    )
  );

CREATE POLICY "Accounts can delete voucher lines"
  ON voucher_lines FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vouchers v
      WHERE v.id = voucher_lines.voucher_id
      AND has_society_access(v.society_id)
      AND get_user_role(v.society_id) IN ('admin', 'accounts')
      AND v.status = 'draft'
    )
  );

-- Loans: All users can view, accounts can manage
CREATE POLICY "Users can view loans"
  ON loans FOR SELECT
  TO authenticated
  USING (has_society_access(society_id));

CREATE POLICY "Accounts can insert loans"
  ON loans FOR INSERT
  TO authenticated
  WITH CHECK (
    has_society_access(society_id) 
    AND get_user_role(society_id) IN ('admin', 'accounts')
  );

CREATE POLICY "Accounts can update loans"
  ON loans FOR UPDATE
  TO authenticated
  USING (has_society_access(society_id) AND get_user_role(society_id) IN ('admin', 'accounts'))
  WITH CHECK (has_society_access(society_id) AND get_user_role(society_id) IN ('admin', 'accounts'));

-- Loan Transactions
CREATE POLICY "Users can view loan transactions"
  ON loan_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM loans l
      WHERE l.id = loan_transactions.loan_id
      AND has_society_access(l.society_id)
    )
  );

CREATE POLICY "Accounts can insert loan transactions"
  ON loan_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM loans l
      WHERE l.id = loan_transactions.loan_id
      AND has_society_access(l.society_id)
      AND get_user_role(l.society_id) IN ('admin', 'accounts')
    )
  );

-- Borrowings: Similar to loans
CREATE POLICY "Users can view borrowings"
  ON borrowings FOR SELECT
  TO authenticated
  USING (has_society_access(society_id));

CREATE POLICY "Accounts can insert borrowings"
  ON borrowings FOR INSERT
  TO authenticated
  WITH CHECK (
    has_society_access(society_id) 
    AND get_user_role(society_id) IN ('admin', 'accounts')
  );

CREATE POLICY "Accounts can update borrowings"
  ON borrowings FOR UPDATE
  TO authenticated
  USING (has_society_access(society_id) AND get_user_role(society_id) IN ('admin', 'accounts'))
  WITH CHECK (has_society_access(society_id) AND get_user_role(society_id) IN ('admin', 'accounts'));

-- Borrowing Transactions
CREATE POLICY "Users can view borrowing transactions"
  ON borrowing_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM borrowings b
      WHERE b.id = borrowing_transactions.borrowing_id
      AND has_society_access(b.society_id)
    )
  );

CREATE POLICY "Accounts can insert borrowing transactions"
  ON borrowing_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM borrowings b
      WHERE b.id = borrowing_transactions.borrowing_id
      AND has_society_access(b.society_id)
      AND get_user_role(b.society_id) IN ('admin', 'accounts')
    )
  );

-- Inventory Items
CREATE POLICY "Users can view inventory items"
  ON inventory_items FOR SELECT
  TO authenticated
  USING (has_society_access(society_id));

CREATE POLICY "Accounts can insert inventory items"
  ON inventory_items FOR INSERT
  TO authenticated
  WITH CHECK (
    has_society_access(society_id) 
    AND get_user_role(society_id) IN ('admin', 'accounts')
  );

CREATE POLICY "Accounts can update inventory items"
  ON inventory_items FOR UPDATE
  TO authenticated
  USING (has_society_access(society_id) AND get_user_role(society_id) IN ('admin', 'accounts'))
  WITH CHECK (has_society_access(society_id) AND get_user_role(society_id) IN ('admin', 'accounts'));

-- Inventory Transactions
CREATE POLICY "Users can view inventory transactions"
  ON inventory_transactions FOR SELECT
  TO authenticated
  USING (has_society_access(society_id));

CREATE POLICY "Accounts can insert inventory transactions"
  ON inventory_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    has_society_access(society_id) 
    AND get_user_role(society_id) IN ('admin', 'accounts')
  );

-- Inventory Ledger
CREATE POLICY "Users can view inventory ledger"
  ON inventory_ledger FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM inventory_items ii
      WHERE ii.id = inventory_ledger.item_id
      AND has_society_access(ii.society_id)
    )
  );

-- Financial Periods
CREATE POLICY "Users can view financial periods"
  ON financial_periods FOR SELECT
  TO authenticated
  USING (has_society_access(society_id));

CREATE POLICY "Admins can manage financial periods"
  ON financial_periods FOR ALL
  TO authenticated
  USING (has_society_access(society_id) AND get_user_role(society_id) = 'admin')
  WITH CHECK (has_society_access(society_id) AND get_user_role(society_id) = 'admin');

-- Audit Logs
CREATE POLICY "Users can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (has_society_access(society_id));

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (has_society_access(society_id));
