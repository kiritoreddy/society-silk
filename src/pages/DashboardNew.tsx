import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useSociety } from '@/contexts/SocietyContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Banknote,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export default function DashboardNew() {
  const { currentSociety } = useSociety();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    cashOnHand: 0,
    bankBalance: 0,
    todayReceipts: 0,
    todayPayments: 0,
    outstandingLoans: 0,
    outstandingBorrowings: 0,
    activeMembers: 0,
    inventoryValue: 0,
    pendingApprovals: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentVouchers, setRecentVouchers] = useState<any[]>([]);

  useEffect(() => {
    if (currentSociety) {
      loadDashboardData();
    }
  }, [currentSociety]);

  const loadDashboardData = async () => {
    if (!currentSociety) return;

    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      const [
        loansResponse,
        borrowingsResponse,
        membersResponse,
        inventoryResponse,
        vouchersResponse,
        todayVouchersResponse
      ] = await Promise.all([
        supabase
          .from('loans')
          .select('outstanding_principal')
          .eq('society_id', currentSociety.id)
          .eq('status', 'active'),
        supabase
          .from('borrowings')
          .select('outstanding_principal')
          .eq('society_id', currentSociety.id)
          .eq('status', 'active'),
        supabase
          .from('members')
          .select('id', { count: 'exact' })
          .eq('society_id', currentSociety.id)
          .eq('status', 'active'),
        supabase
          .from('inventory_items')
          .select('current_value')
          .eq('society_id', currentSociety.id)
          .eq('is_active', true),
        supabase
          .from('vouchers')
          .select('*')
          .eq('society_id', currentSociety.id)
          .in('status', ['draft', 'verified'])
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('vouchers')
          .select('*, voucher_lines(*)')
          .eq('society_id', currentSociety.id)
          .eq('voucher_date', today)
          .eq('status', 'posted')
      ]);

      let todayReceipts = 0;
      let todayPayments = 0;

      if (todayVouchersResponse.data) {
        todayVouchersResponse.data.forEach((voucher: any) => {
          voucher.voucher_lines?.forEach((line: any) => {
            if (line.side === 'debit') {
              todayReceipts += Number(line.total_amount || 0);
            } else {
              todayPayments += Number(line.total_amount || 0);
            }
          });
        });
      }

      const outstandingLoans = loansResponse.data?.reduce(
        (sum, loan) => sum + Number(loan.outstanding_principal || 0),
        0
      ) || 0;

      const outstandingBorrowings = borrowingsResponse.data?.reduce(
        (sum, borrowing) => sum + Number(borrowing.outstanding_principal || 0),
        0
      ) || 0;

      const inventoryValue = inventoryResponse.data?.reduce(
        (sum, item) => sum + Number(item.current_value || 0),
        0
      ) || 0;

      setMetrics({
        cashOnHand: 0,
        bankBalance: 0,
        todayReceipts,
        todayPayments,
        outstandingLoans,
        outstandingBorrowings,
        activeMembers: membersResponse.count || 0,
        inventoryValue,
        pendingApprovals: vouchersResponse.data?.length || 0,
      });

      setRecentVouchers(vouchersResponse.data || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Cash on Hand',
      value: `₹${metrics.cashOnHand.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      icon: Banknote,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: "Today's Receipts",
      value: `₹${metrics.todayReceipts.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      icon: ArrowUpRight,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: "Today's Payments",
      value: `₹${metrics.todayPayments.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      icon: ArrowDownRight,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Outstanding Loans',
      value: `₹${metrics.outstandingLoans.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Outstanding Borrowings',
      value: `₹${metrics.outstandingBorrowings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      icon: TrendingDown,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Active Members',
      value: metrics.activeMembers.toString(),
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Inventory Value',
      value: `₹${metrics.inventoryValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      icon: Package,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'Pending Approvals',
      value: metrics.pendingApprovals.toString(),
      icon: Clock,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'posted': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'approved': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'verified': return <Clock className="h-4 w-4 text-amber-600" />;
      case 'draft': return <AlertCircle className="h-4 w-4 text-gray-600" />;
      default: return null;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back! Here's what's happening with {currentSociety?.name}
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => navigate('/vouchers')} variant="outline">
              Create Voucher
            </Button>
            <Button onClick={() => navigate('/day-book')} className="bg-blue-600 hover:bg-blue-700">
              View Day Book
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Vouchers Needing Action</CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate('/vouchers')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentVouchers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p>All vouchers are up to date!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentVouchers.map((voucher) => (
                  <div
                    key={voucher.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/vouchers/${voucher.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      {getStatusIcon(voucher.status)}
                      <div>
                        <p className="font-medium text-gray-900">{voucher.voucher_number}</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(voucher.voucher_date), 'dd MMM yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={
                          voucher.status === 'draft'
                            ? 'border-gray-300 text-gray-700'
                            : voucher.status === 'verified'
                            ? 'border-amber-300 text-amber-700'
                            : 'border-blue-300 text-blue-700'
                        }
                      >
                        {voucher.status}
                      </Badge>
                      <span className="font-semibold text-gray-900">
                        ₹{Number(voucher.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => navigate('/members')}>
                  <Users className="h-5 w-5" />
                  <span>Add Member</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => navigate('/loans')}>
                  <TrendingUp className="h-5 w-5" />
                  <span>New Loan</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => navigate('/inventory')}>
                  <Package className="h-5 w-5" />
                  <span>Add Stock</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => navigate('/reports')}>
                  <TrendingUp className="h-5 w-5" />
                  <span>View Reports</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Net Cash Flow (Today)</span>
                  <span className={`font-semibold ${metrics.todayReceipts - metrics.todayPayments >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{(metrics.todayReceipts - metrics.todayPayments).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Assets (Loans)</span>
                  <span className="font-semibold text-gray-900">
                    ₹{metrics.outstandingLoans.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Liabilities (Borrowings)</span>
                  <span className="font-semibold text-gray-900">
                    ₹{metrics.outstandingBorrowings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <span className="text-gray-900 font-medium">Net Position</span>
                  <span className={`font-bold ${metrics.outstandingLoans - metrics.outstandingBorrowings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{(metrics.outstandingLoans - metrics.outstandingBorrowings).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
