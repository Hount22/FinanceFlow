import { useState, useMemo } from "react";
import { useTransactions } from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Transaction, InsertTransaction } from "@shared/schema";

export default function TransactionTable() {
  const { data: transactions = [], isLoading } = useTransactions();
  const { data: categories = [] } = useCategories();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return new Date().toISOString().slice(0, 7);
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateTransaction = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertTransaction> }) => {
      return apiRequest("PUT", `/api/transactions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update transaction",
        variant: "destructive",
      });
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
      });
    },
  });

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  const runningBalances = useMemo(() => {
    let balance = 0;
    return filteredTransactions.map(transaction => {
      const amount = parseFloat(transaction.amount);
      if (transaction.type === "income") {
        balance += amount;
      } else {
        balance -= amount;
      }
      return balance;
    });
  }, [filteredTransactions]);

  const handleCellUpdate = (transaction: Transaction, field: keyof InsertTransaction, value: string) => {
    updateTransaction.mutate({
      id: transaction.id,
      data: { [field]: value }
    });
  };

  const monthOptions = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = date.toISOString().slice(0, 7);
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      months.push({ value: monthStr, label });
    }
    return months;
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground">Loading transactions...</div>
      </div>
    );
  }

  return (
    <>
      {/* Toolbar */}
      <div className="bg-card border-b border-border px-6 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" title="Add Row" data-testid="button-add-row">
              <i className="fas fa-plus text-muted-foreground"></i>
            </Button>
            <Button variant="ghost" size="sm" title="Sort" data-testid="button-sort">
              <i className="fas fa-sort text-muted-foreground"></i>
            </Button>
            <Button variant="ghost" size="sm" title="Filter" data-testid="button-filter">
              <i className="fas fa-filter text-muted-foreground"></i>
            </Button>
          </div>
          
          <div className="flex items-center space-x-3">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48" data-testid="select-month">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(month => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Spreadsheet Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="bg-card">
          {/* Header Row */}
          <div className="grid grid-cols-6 bg-muted/50 sticky top-0 z-10">
            <div className="table-cell p-3 font-medium text-sm text-muted-foreground bg-muted/50">Date</div>
            <div className="table-cell p-3 font-medium text-sm text-muted-foreground bg-muted/50">Description</div>
            <div className="table-cell p-3 font-medium text-sm text-muted-foreground bg-muted/50">Category</div>
            <div className="table-cell p-3 font-medium text-sm text-muted-foreground bg-muted/50">Type</div>
            <div className="table-cell p-3 font-medium text-sm text-muted-foreground bg-muted/50 text-right">Amount</div>
            <div className="table-cell p-3 font-medium text-sm text-muted-foreground bg-muted/50 text-right">Balance</div>
          </div>

          {/* Transaction Rows */}
          {filteredTransactions.map((transaction, index) => (
            <div key={transaction.id} className="grid grid-cols-6 hover:bg-muted/30 group">
              <div className="table-cell">
                <Input
                  type="date"
                  className="spreadsheet-input border-none bg-transparent focus:outline-none focus:ring-0"
                  value={transaction.date}
                  onChange={(e) => handleCellUpdate(transaction, 'date', e.target.value)}
                  data-testid={`input-date-${index}`}
                />
              </div>
              <div className="table-cell">
                <Input
                  type="text"
                  className="spreadsheet-input border-none bg-transparent focus:outline-none focus:ring-0"
                  value={transaction.description}
                  onChange={(e) => handleCellUpdate(transaction, 'description', e.target.value)}
                  data-testid={`input-description-${index}`}
                />
              </div>
              <div className="table-cell">
                <Select 
                  value={transaction.category} 
                  onValueChange={(value) => handleCellUpdate(transaction, 'category', value)}
                >
                  <SelectTrigger className="spreadsheet-input border-none bg-transparent focus:outline-none focus:ring-0" data-testid={`select-category-${index}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="table-cell">
                <Select 
                  value={transaction.type} 
                  onValueChange={(value) => handleCellUpdate(transaction, 'type', value)}
                >
                  <SelectTrigger className="spreadsheet-input border-none bg-transparent focus:outline-none focus:ring-0" data-testid={`select-type-${index}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="table-cell">
                <Input
                  type="number"
                  step="0.01"
                  className={`spreadsheet-input border-none bg-transparent focus:outline-none focus:ring-0 text-right ${
                    transaction.type === 'income' ? 'text-success' : 'text-destructive'
                  }`}
                  value={transaction.amount}
                  onChange={(e) => handleCellUpdate(transaction, 'amount', e.target.value)}
                  data-testid={`input-amount-${index}`}
                />
              </div>
              <div className="table-cell">
                <div className="p-3 text-right font-mono text-sm text-foreground flex items-center justify-between">
                  <span data-testid={`text-balance-${index}`}>
                    ${runningBalances[index]?.toFixed(2) || '0.00'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 ml-2 h-6 w-6 p-0"
                    onClick={() => deleteTransaction.mutate(transaction.id)}
                    data-testid={`button-delete-${index}`}
                  >
                    <i className="fas fa-trash text-xs text-destructive"></i>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Summary Bar */}
      <div className="bg-card border-t border-border p-4">
        <div className="grid grid-cols-6 text-sm">
          <div className="col-span-4"></div>
          <div className="text-right font-medium text-foreground">Total:</div>
          <div className="text-right font-bold font-mono" data-testid="text-total-balance">
            <span className={runningBalances[runningBalances.length - 1] >= 0 ? 'text-success' : 'text-destructive'}>
              {runningBalances[runningBalances.length - 1] >= 0 ? '+' : ''}${runningBalances[runningBalances.length - 1]?.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
