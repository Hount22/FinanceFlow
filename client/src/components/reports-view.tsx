import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions } from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";

export default function ReportsView() {
  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();

  const spendingTrendsData = useMemo(() => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date.toISOString().slice(0, 7);
    }).reverse();

    return last6Months.map(month => {
      const monthTransactions = transactions.filter(t => t.date.startsWith(month));
      const income = monthTransactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const expenses = monthTransactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      return {
        month: new Date(month + "-01").toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        Income: income,
        Expenses: expenses,
        Net: income - expenses
      };
    });
  }, [transactions]);

  const categoryBreakdownData = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyExpenses = transactions
      .filter(t => t.type === "expense" && t.date.startsWith(currentMonth))
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
        return acc;
      }, {} as Record<string, number>);

    const colors = [
      "hsl(var(--chart-1))",
      "hsl(var(--chart-2))",
      "hsl(var(--chart-3))",
      "hsl(var(--chart-4))",
      "hsl(var(--chart-5))",
      "hsl(var(--primary))",
      "hsl(var(--destructive))",
      "hsl(var(--warning))",
    ];

    return Object.entries(monthlyExpenses).map(([category, amount], index) => ({
      name: category,
      value: amount,
      color: colors[index % colors.length]
    }));
  }, [transactions]);

  const monthlyStats = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthTransactions = transactions.filter(t => t.date.startsWith(currentMonth));
    
    const totalIncome = monthTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const totalExpenses = monthTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const avgTransaction = monthTransactions.length > 0 
      ? monthTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0) / monthTransactions.length
      : 0;

    return {
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      transactionCount: monthTransactions.length,
      avgTransaction
    };
  }, [transactions]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Financial Reports</h2>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Income</p>
                <p className={`text-2xl font-bold ${monthlyStats.netIncome >= 0 ? 'text-success' : 'text-destructive'}`} data-testid="text-net-income">
                  {monthlyStats.netIncome >= 0 ? '+' : ''}${monthlyStats.netIncome.toFixed(2)}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                monthlyStats.netIncome >= 0 ? 'bg-success/10' : 'bg-destructive/10'
              }`}>
                <i className={`fas ${monthlyStats.netIncome >= 0 ? 'fa-arrow-up text-success' : 'fa-arrow-down text-destructive'}`}></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold" data-testid="text-transaction-count">{monthlyStats.transactionCount}</p>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <i className="fas fa-exchange-alt text-primary"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Transaction</p>
                <p className="text-2xl font-bold" data-testid="text-avg-transaction">${monthlyStats.avgTransaction.toFixed(2)}</p>
              </div>
              <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                <i className="fas fa-calculator text-accent-foreground"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Savings Rate</p>
                <p className="text-2xl font-bold text-success" data-testid="text-savings-rate">
                  {monthlyStats.totalIncome > 0 
                    ? ((monthlyStats.netIncome / monthlyStats.totalIncome) * 100).toFixed(1)
                    : '0.0'
                  }%
                </p>
              </div>
              <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                <i className="fas fa-piggy-bank text-success"></i>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Income vs Expenses Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={spendingTrendsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, ""]} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="Income" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--success))" }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Expenses" 
                    stroke="hsl(var(--destructive))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--destructive))" }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Net" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Categories (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdownData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${value}`, ""]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>6-Month Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendingTrendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, ""]} />
                <Legend />
                <Bar dataKey="Income" fill="hsl(var(--success))" name="Income" />
                <Bar dataKey="Expenses" fill="hsl(var(--destructive))" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
