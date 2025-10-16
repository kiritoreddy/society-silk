export type UserRole = 'admin' | 'accounts' | 'auditor' | 'viewer';
export type VoucherStatus = 'draft' | 'verified' | 'approved' | 'posted' | 'cancelled';
export type VoucherType = 'receipt' | 'payment' | 'journal' | 'contra';
export type EntrySide = 'debit' | 'credit';
export type AccountCategory = 'asset' | 'liability' | 'income' | 'expenditure';
export type PaymentMode = 'cash' | 'transfer' | 'cheque';
export type LoanStatus = 'active' | 'closed' | 'defaulted';
export type InventoryTransactionType = 'purchase' | 'sale' | 'adjustment_in' | 'adjustment_out';
export type MemberStatus = 'active' | 'inactive' | 'suspended';

export interface Organization {
  id: string;
  name: string;
  code: string;
  created_at: string;
  updated_at: string;
}

export interface Society {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  registration_number?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SocietySettings {
  id: string;
  society_id: string;
  financial_year_start: string;
  financial_year_end: string;
  voucher_prefix: string;
  default_loan_interest_rate: number;
  default_borrowing_interest_rate: number;
  inventory_valuation_method: string;
  enable_maker_checker: boolean;
  created_at: string;
  updated_at: string;
}

export interface SocietyUser {
  id: string;
  society_id: string;
  user_id: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  society_id: string;
  member_number: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  date_of_joining: string;
  status: MemberStatus;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface AccountHead {
  id: string;
  society_id: string;
  code: string;
  name: string;
  category: AccountCategory;
  parent_id?: string;
  is_system: boolean;
  is_active: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Voucher {
  id: string;
  society_id: string;
  voucher_number: string;
  society_voucher_number?: string;
  voucher_date: string;
  voucher_type: VoucherType;
  status: VoucherStatus;
  narration?: string;
  total_amount: number;
  member_id?: string;
  created_by?: string;
  verified_by?: string;
  approved_by?: string;
  posted_by?: string;
  created_at: string;
  verified_at?: string;
  approved_at?: string;
  posted_at?: string;
  updated_at: string;
}

export interface VoucherLine {
  id: string;
  voucher_id: string;
  line_number: number;
  side: EntrySide;
  account_head_id: string;
  particulars: string;
  cash_amount: number;
  transfer_amount: number;
  total_amount: number;
  member_id?: string;
  created_at: string;
}

export interface VoucherWithLines extends Voucher {
  voucher_lines: VoucherLine[];
  member?: Member;
  debit_lines: VoucherLine[];
  credit_lines: VoucherLine[];
  debit_total: number;
  credit_total: number;
  is_balanced: boolean;
}

export interface Loan {
  id: string;
  society_id: string;
  loan_number: string;
  member_id: string;
  principal_amount: number;
  interest_rate: number;
  start_date: string;
  disbursement_date?: string;
  status: LoanStatus;
  outstanding_principal: number;
  outstanding_interest: number;
  disbursement_voucher_id?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface LoanTransaction {
  id: string;
  loan_id: string;
  transaction_date: string;
  transaction_type: string;
  principal_amount: number;
  interest_amount: number;
  total_amount: number;
  voucher_id?: string;
  notes?: string;
  created_at: string;
}

export interface Borrowing {
  id: string;
  society_id: string;
  borrowing_number: string;
  lender_name: string;
  principal_amount: number;
  interest_rate: number;
  start_date: string;
  disbursement_date?: string;
  status: LoanStatus;
  outstanding_principal: number;
  outstanding_interest: number;
  disbursement_voucher_id?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface BorrowingTransaction {
  id: string;
  borrowing_id: string;
  transaction_date: string;
  transaction_type: string;
  principal_amount: number;
  interest_amount: number;
  total_amount: number;
  voucher_id?: string;
  notes?: string;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  society_id: string;
  sku: string;
  name: string;
  uom: string;
  opening_quantity: number;
  opening_value: number;
  current_quantity: number;
  current_value: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryTransaction {
  id: string;
  society_id: string;
  item_id: string;
  transaction_date: string;
  transaction_type: InventoryTransactionType;
  quantity: number;
  rate: number;
  amount: number;
  voucher_id?: string;
  narration?: string;
  created_by?: string;
  created_at: string;
}

export interface InventoryLedger {
  id: string;
  item_id: string;
  transaction_id: string;
  transaction_date: string;
  quantity_in: number;
  quantity_out: number;
  balance_quantity: number;
  value_in: number;
  value_out: number;
  balance_value: number;
  created_at: string;
}

export interface FinancialPeriod {
  id: string;
  society_id: string;
  period_start: string;
  period_end: string;
  is_locked: boolean;
  locked_by?: string;
  locked_at?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  society_id: string;
  table_name: string;
  record_id: string;
  action: string;
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
  user_id?: string;
  ip_address?: string;
  created_at: string;
}

export interface DayBookEntry {
  voucher_id: string;
  voucher_number: string;
  society_voucher_number?: string;
  voucher_date: string;
  side: EntrySide;
  particulars: string;
  cash_amount: number;
  transfer_amount: number;
  total_amount: number;
  account_head?: string;
  member_name?: string;
}

export interface DayBookSummary {
  date: string;
  opening_cash: number;
  total_receipts_cash: number;
  total_payments_cash: number;
  closing_cash: number;
  total_receipts_transfer: number;
  total_payments_transfer: number;
  total_receipts: number;
  total_payments: number;
  is_balanced: boolean;
}

export interface DashboardMetrics {
  today_receipts: number;
  today_payments: number;
  cash_on_hand: number;
  bank_balance: number;
  outstanding_loans: number;
  outstanding_borrowings: number;
  pending_approvals: number;
  active_members: number;
  inventory_value: number;
}

export interface LedgerEntry {
  date: string;
  voucher_number: string;
  particulars: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface TrialBalanceEntry {
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
}

export interface ProfitLossEntry {
  account_name: string;
  amount: number;
  category: 'income' | 'expenditure';
}

export interface BalanceSheetEntry {
  account_name: string;
  amount: number;
  category: 'asset' | 'liability';
}
