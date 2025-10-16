import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Calendar, Download, IndianRupee } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type VoucherLine = {
  particulars: string;
  cash_amount: number;
  transfer_amount: number;
  total: number;
};

export default function DayBook() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [openingCash, setOpeningCash] = useState(0);
  const [receipts, setReceipts] = useState<VoucherLine[]>([]);
  const [payments, setPayments] = useState<VoucherLine[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadDayBookData();
  }, [selectedDate]);

  const loadDayBookData = async () => {
    const societyId = localStorage.getItem("selectedSocietyId");
    if (!societyId) {
      navigate("/select-society");
      return;
    }

    try {
      // Load opening cash from society
      const { data: society } = await supabase
        .from("societies")
        .select("opening_cash")
        .eq("id", societyId)
        .single();

      if (society) {
        setOpeningCash(society.opening_cash);
      }

      // Load vouchers for the selected date
      const { data: vouchers, error } = await supabase
        .from("vouchers")
        .select(`
          *,
          voucher_lines(
            line_type,
            particulars,
            cash_amount,
            transfer_amount
          )
        `)
        .eq("society_id", societyId)
        .eq("voucher_date", selectedDate)
        .eq("status", "posted");

      if (error) throw error;

      // Separate receipts and payments
      const receiptLines: VoucherLine[] = [];
      const paymentLines: VoucherLine[] = [];

      vouchers?.forEach((voucher: any) => {
        voucher.voucher_lines?.forEach((line: any) => {
          const total = line.cash_amount + line.transfer_amount;
          const voucherLine = {
            particulars: line.particulars,
            cash_amount: line.cash_amount,
            transfer_amount: line.transfer_amount,
            total,
          };

          if (line.line_type === "receipt") {
            receiptLines.push(voucherLine);
          } else {
            paymentLines.push(voucherLine);
          }
        });
      });

      setReceipts(receiptLines);
      setPayments(paymentLines);
    } catch (error: any) {
      toast.error("Failed to load day book data");
    }
  };

  const totalReceipts = receipts.reduce((sum, r) => sum + r.total, 0);
  const totalReceiptsCash = receipts.reduce((sum, r) => sum + r.cash_amount, 0);
  const totalReceiptsTransfer = receipts.reduce((sum, r) => sum + r.transfer_amount, 0);

  const totalPayments = payments.reduce((sum, p) => sum + p.total, 0);
  const totalPaymentsCash = payments.reduce((sum, p) => sum + p.cash_amount, 0);
  const totalPaymentsTransfer = payments.reduce((sum, p) => sum + p.transfer_amount, 0);

  const closingCash = openingCash + totalReceiptsCash - totalPaymentsCash;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Day Book</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Date Selector */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="max-w-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Cash Balance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-primary/5">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">Opening Cash</div>
              <div className="text-2xl font-bold flex items-center gap-1">
                <IndianRupee className="h-5 w-5" />
                {openingCash.toLocaleString("en-IN")}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-success/5">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">Total Receipts (Cash)</div>
              <div className="text-2xl font-bold text-success flex items-center gap-1">
                <IndianRupee className="h-5 w-5" />
                {totalReceiptsCash.toLocaleString("en-IN")}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-destructive/5">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">Total Payments (Cash)</div>
              <div className="text-2xl font-bold text-destructive flex items-center gap-1">
                <IndianRupee className="h-5 w-5" />
                {totalPaymentsCash.toLocaleString("en-IN")}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Day Book Dual Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Receipts (Left) */}
          <Card>
            <CardHeader className="bg-success/10">
              <CardTitle className="text-success">Receipts / Debit</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 text-xs">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Particulars</th>
                      <th className="px-4 py-3 text-right font-medium">Cash (₹)</th>
                      <th className="px-4 py-3 text-right font-medium">Transfer (₹)</th>
                      <th className="px-4 py-3 text-right font-medium">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {receipts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                          No receipts for this date
                        </td>
                      </tr>
                    ) : (
                      receipts.map((receipt, idx) => (
                        <tr key={idx} className="hover:bg-muted/30">
                          <td className="px-4 py-3 text-sm">{receipt.particulars}</td>
                          <td className="px-4 py-3 text-sm text-right">
                            {receipt.cash_amount.toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            {receipt.transfer_amount.toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium">
                            {receipt.total.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))
                    )}
                    <tr className="bg-success/10 font-bold">
                      <td className="px-4 py-3">Total Receipts</td>
                      <td className="px-4 py-3 text-right">{totalReceiptsCash.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-right">{totalReceiptsTransfer.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-right">{totalReceipts.toLocaleString("en-IN")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Payments (Right) */}
          <Card>
            <CardHeader className="bg-destructive/10">
              <CardTitle className="text-destructive">Payments / Credit</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 text-xs">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Particulars</th>
                      <th className="px-4 py-3 text-right font-medium">Cash (₹)</th>
                      <th className="px-4 py-3 text-right font-medium">Transfer (₹)</th>
                      <th className="px-4 py-3 text-right font-medium">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                          No payments for this date
                        </td>
                      </tr>
                    ) : (
                      payments.map((payment, idx) => (
                        <tr key={idx} className="hover:bg-muted/30">
                          <td className="px-4 py-3 text-sm">{payment.particulars}</td>
                          <td className="px-4 py-3 text-sm text-right">
                            {payment.cash_amount.toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            {payment.transfer_amount.toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium">
                            {payment.total.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))
                    )}
                    <tr className="bg-destructive/10 font-bold">
                      <td className="px-4 py-3">Total Payments</td>
                      <td className="px-4 py-3 text-right">{totalPaymentsCash.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-right">{totalPaymentsTransfer.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-right">{totalPayments.toLocaleString("en-IN")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Closing Balance */}
        <Card className="mt-6 bg-gradient-to-r from-primary to-secondary text-white">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm opacity-90 mb-1">Closing Cash Balance</div>
                <div className="text-3xl font-bold flex items-center gap-2">
                  <IndianRupee className="h-7 w-7" />
                  {closingCash.toLocaleString("en-IN")}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-90">Formula</div>
                <div className="text-sm">Opening + Receipts - Payments</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
