import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBudgets } from "@/hooks/use-budgets";
import { useCategories } from "@/hooks/use-categories";
import { useTransactions } from "@/hooks/use-transactions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

export default function BudgetView() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return new Date().toISOString().slice(0, 7);
  });
  const [newBudget, setNewBudget] = useState({ category: "", amount: "" });
  
  const { data: budgets = [] } = useBudgets(selectedMonth);
  const { data: categories = [] } = useCategories();
  const { data: transactions = [] } = useTransactions();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createBudget = useMutation({
    mutationFn: async (data: { category: string; amount: string; month: string }) => {
      return apiRequest("POST", "/api/budgets", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      setNewBudget({ category: "", amount: "" });
      toast({
        title: "Success",
        description: "Budget created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create budget",
        variant: "destructive",
      });
    },
  });

  const monthlyExpenses = useMemo(() => {
    return transactions
      .filter(t => t.type === "expense" && t.date.startsWith(selectedMonth))
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
        return acc;
      }, {} as Record<string, number>);
  }, [transactions, selectedMonth]);

  const budgetData = useMemo(() => {
    const expenseCategories = categories.filter(c => c.type === "expense");
    return expenseCategories.map(category => {
      const budget = budgets.find(b => b.category === category.name);
      const spent = monthlyExpenses[category.name] || 0;
      const budgetAmount = budget ? parseFloat(budget.amount) : 0;
      const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
      
      return {
        name: category.name,
        budget: budgetAmount,
        spent,
        remaining: Math.max(0, budgetAmount - spent),
        percentage: Math.min(100, percentage),
        status: percentage > 100 ? 'over' : percentage > 80 ? 'warning' : 'good'
      };
    });
  }, [categories, budgets, monthlyExpenses]);

  const chartData = budgetData.map(item => ({
    category: item.name,
    Budget: item.budget,
    Spent: item.spent,
  }));

  const handleCreateBudget = () => {
    if (!newBudget.category || !newBudget.amount) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    createBudget.mutate({
      category: newBudget.category,
      amount: newBudget.amount,
      month: selectedMonth,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Budget Management</h2>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-48" data-testid="select-budget-month">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => {
              const date = new Date();
              date.setMonth(date.getMonth() - i);
              const monthStr = date.toISOString().slice(0, 7);
              const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
              return (
                <SelectItem key={monthStr} value={monthStr}>
                  {label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget vs Actual Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Budget vs Actual Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="category" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, ""]} />
                  <Legend />
                  <Bar dataKey="Budget" fill="hsl(var(--primary))" name="Budget" />
                  <Bar dataKey="Spent" fill="hsl(var(--destructive))" name="Spent" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Create New Budget */}
        <Card>
          <CardHeader>
            <CardTitle>Set Budget</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="budget-category">Category</Label>
              <Select value={newBudget.category} onValueChange={(value) => setNewBudget(prev => ({ ...prev, category: value }))}>
                <SelectTrigger data-testid="select-new-budget-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(c => c.type === "expense").map(category => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="budget-amount">Monthly Budget Amount</Label>
              <Input
                id="budget-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newBudget.amount}
                onChange={(e) => setNewBudget(prev => ({ ...prev, amount: e.target.value }))}
                data-testid="input-budget-amount"
              />
            </div>
            <Button 
              onClick={handleCreateBudget}
              disabled={createBudget.isPending}
              className="w-full"
              data-testid="button-create-budget"
            >
              {createBudget.isPending ? "Creating..." : "Set Budget"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Budget Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {budgetData.map((item) => (
              <div key={item.name} className="space-y-2" data-testid={`budget-item-${item.name.toLowerCase().replace(/ /g, '-')}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      ${item.spent.toFixed(2)} / ${item.budget.toFixed(2)} budget
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      item.status === 'over' ? 'text-destructive' :
                      item.status === 'warning' ? 'text-warning' : 'text-success'
                    }`}>
                      {item.percentage.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ${item.remaining.toFixed(2)} remaining
                    </div>
                  </div>
                </div>
                <Progress 
                  value={Math.min(100, item.percentage)} 
                  className={`h-2 ${
                    item.status === 'over' ? '[&>div]:bg-destructive' :
                    item.status === 'warning' ? '[&>div]:bg-warning' : '[&>div]:bg-success'
                  }`}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
