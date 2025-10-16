/*
  # Seed Default Account Heads for New Societies

  ## Purpose
  Creates a function to automatically set up default Chart of Accounts
  when a new society is created.

  ## Default Accounts Created
  
  ### Assets
  - Cash in Hand
  - Bank Accounts
  - Loans Receivable (Principal)
  - Interest Receivable
  - Inventory/Stock
  
  ### Liabilities
  - Borrowings (Principal)
  - Interest Payable
  - Member Deposits
  
  ### Income
  - Interest Income on Loans
  - Sales Revenue
  - Other Income
  
  ### Expenditure
  - Interest Expense on Borrowings
  - Cost of Goods Sold
  - Administrative Expenses
  - Salaries & Wages
  - Rounding Differences
*/

-- Function to create default account heads for a society
CREATE OR REPLACE FUNCTION create_default_account_heads(p_society_id uuid)
RETURNS void AS $$
BEGIN
  -- Assets
  INSERT INTO account_heads (society_id, code, name, category, is_system)
  VALUES
    (p_society_id, 'A001', 'Cash in Hand', 'asset', true),
    (p_society_id, 'A002', 'Bank Account - Current', 'asset', true),
    (p_society_id, 'A003', 'Bank Account - Savings', 'asset', true),
    (p_society_id, 'A101', 'Loans to Members - Principal', 'asset', true),
    (p_society_id, 'A102', 'Interest Receivable on Loans', 'asset', true),
    (p_society_id, 'A201', 'Inventory - Finished Goods', 'asset', true),
    (p_society_id, 'A202', 'Inventory - Raw Materials', 'asset', true);

  -- Liabilities
  INSERT INTO account_heads (society_id, code, name, category, is_system)
  VALUES
    (p_society_id, 'L001', 'Borrowings from Banks - Principal', 'liability', true),
    (p_society_id, 'L002', 'Interest Payable on Borrowings', 'liability', true),
    (p_society_id, 'L101', 'Member Share Capital', 'liability', true),
    (p_society_id, 'L102', 'Member Deposits', 'liability', true),
    (p_society_id, 'L201', 'Reserves and Surplus', 'liability', true);

  -- Income
  INSERT INTO account_heads (society_id, code, name, category, is_system)
  VALUES
    (p_society_id, 'I001', 'Interest Income on Loans', 'income', true),
    (p_society_id, 'I002', 'Sales Revenue', 'income', true),
    (p_society_id, 'I003', 'Service Charges', 'income', true),
    (p_society_id, 'I004', 'Other Income', 'income', true);

  -- Expenditure
  INSERT INTO account_heads (society_id, code, name, category, is_system)
  VALUES
    (p_society_id, 'E001', 'Interest Expense on Borrowings', 'expenditure', true),
    (p_society_id, 'E002', 'Cost of Goods Sold', 'expenditure', true),
    (p_society_id, 'E003', 'Purchases', 'expenditure', true),
    (p_society_id, 'E101', 'Salaries and Wages', 'expenditure', true),
    (p_society_id, 'E102', 'Rent and Utilities', 'expenditure', true),
    (p_society_id, 'E103', 'Office Expenses', 'expenditure', true),
    (p_society_id, 'E104', 'Depreciation', 'expenditure', true),
    (p_society_id, 'E999', 'Rounding Differences', 'expenditure', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to initialize society settings
CREATE OR REPLACE FUNCTION initialize_society(p_society_id uuid)
RETURNS void AS $$
BEGIN
  -- Create default settings
  INSERT INTO society_settings (society_id)
  VALUES (p_society_id)
  ON CONFLICT (society_id) DO NOTHING;

  -- Create default account heads
  PERFORM create_default_account_heads(p_society_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-initialize society on creation
CREATE OR REPLACE FUNCTION trigger_initialize_society()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM initialize_society(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_society_created
  AFTER INSERT ON societies
  FOR EACH ROW
  EXECUTE FUNCTION trigger_initialize_society();
