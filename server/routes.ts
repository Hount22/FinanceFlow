import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTransactionSchema, insertBudgetSchema, insertGoalSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Transaction routes
  app.get("/api/transactions", async (req, res) => {
    try {
      const transactions = await storage.getTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(validatedData);
      res.status(201).json(transaction);
    } catch (error) {
      res.status(400).json({ message: "Invalid transaction data" });
    }
  });

  app.put("/api/transactions/:id", async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.partial().parse(req.body);
      const transaction = await storage.updateTransaction(req.params.id, validatedData);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      res.status(400).json({ message: "Invalid transaction data" });
    }
  });

  app.delete("/api/transactions/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTransaction(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // If database fails, try to return some default categories
      if (process.env.DATABASE_URL) {
        console.log('Database error, returning default categories');
        const defaultCategories = [
          { id: '1', name: 'อาหาร', type: 'expense', icon: 'fas fa-utensils', color: 'hsl(var(--chart-1))' },
          { id: '2', name: 'การเดินทาง', type: 'expense', icon: 'fas fa-car', color: 'hsl(var(--chart-2))' },
          { id: '3', name: 'เงินเดือน', type: 'income', icon: 'fas fa-briefcase', color: 'hsl(var(--success))' },
        ];
        res.json(defaultCategories);
      } else {
        res.status(500).json({ message: "Failed to fetch categories" });
      }
    }
  });

  // Budget routes
  app.get("/api/budgets", async (req, res) => {
    try {
      const month = req.query.month as string;
      const budgets = month 
        ? await storage.getBudgetsByMonth(month)
        : await storage.getBudgets();
      res.json(budgets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch budgets" });
    }
  });

  app.post("/api/budgets", async (req, res) => {
    try {
      const validatedData = insertBudgetSchema.parse(req.body);
      const budget = await storage.createBudget(validatedData);
      res.status(201).json(budget);
    } catch (error) {
      res.status(400).json({ message: "Invalid budget data" });
    }
  });

  app.put("/api/budgets/:id", async (req, res) => {
    try {
      const budget = await storage.updateBudget(req.params.id, req.body);
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      res.json(budget);
    } catch (error) {
      res.status(400).json({ message: "Invalid budget data" });
    }
  });

  // Goal routes
  app.get("/api/goals", async (req, res) => {
    try {
      const goals = await storage.getGoals();
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });

  app.post("/api/goals", async (req, res) => {
    try {
      const validatedData = insertGoalSchema.parse(req.body);
      const goal = await storage.createGoal(validatedData);
      res.status(201).json(goal);
    } catch (error) {
      res.status(400).json({ message: "Invalid goal data" });
    }
  });

  app.put("/api/goals/:id", async (req, res) => {
    try {
      const goal = await storage.updateGoal(req.params.id, req.body);
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      res.json(goal);
    } catch (error) {
      res.status(400).json({ message: "Invalid goal data" });
    }
  });

  app.delete("/api/goals/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteGoal(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Goal not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete goal" });
    }
  });

  // Tax calculation utility functions for Thailand
  function calculateThaiTax(annualIncome: number): {
    taxableIncome: number;
    taxAmount: number;
    netIncome: number;
    socialSecurity: number;
    deductions: {
      personal: number;
      spouse: number;
      children: number;
      parents: number;
      socialSecurity: number;
      providentFund: number;
    };
    taxBrackets: Array<{
      range: string;
      rate: number;
      amount: number;
    }>;
  } {
    // ค่าลดหย่อนมาตรฐาน (ปี 2567)
    const personalDeduction = 60000; // ค่าลดหย่อนส่วนตัว
    const spouseDeduction = 60000;   // ค่าลดหย่อนคู่สมรส
    const childDeduction = 30000;    // ค่าลดหย่อนบุตร (คนละ)
    const parentDeduction = 30000;   // ค่าลดหย่อนบิดามารดา (คนละ)
    
    // ประกันสังคม 5% สูงสุด 15,000 บาท/ปี
    const socialSecurity = Math.min(annualIncome * 0.05, 15000);
    
    // กองทุนสำรองเลี้ยงชีพ (สมมติ 3% ของเงินเดือน)
    const providentFund = Math.min(annualIncome * 0.03, 500000);
    
    const deductions = {
      personal: personalDeduction,
      spouse: 0, // จะคำนวณตามสถานะจริง
      children: 0, // จะคำนวณตามจำนวนบุตรจริง
      parents: 0, // จะคำนวณตามจำนวนบิดามารดาจริง
      socialSecurity,
      providentFund
    };
    
    // คำนวณรายได้หลังหักลดหย่อน
    const totalDeductions = personalDeduction + socialSecurity + providentFund;
    const taxableIncome = Math.max(0, annualIncome - totalDeductions);
    
    // อัตราภาษีแบบขั้นบันได (ปี 2567)
    const taxBrackets = [
      { min: 0, max: 150000, rate: 0 },
      { min: 150000, max: 300000, rate: 5 },
      { min: 300000, max: 500000, rate: 10 },
      { min: 500000, max: 750000, rate: 15 },
      { min: 750000, max: 1000000, rate: 20 },
      { min: 1000000, max: 2000000, rate: 25 },
      { min: 2000000, max: 5000000, rate: 30 },
      { min: 5000000, max: Infinity, rate: 35 }
    ];
    
    let taxAmount = 0;
    const bracketDetails: Array<{ range: string; rate: number; amount: number }> = [];
    
    for (const bracket of taxBrackets) {
      if (taxableIncome > bracket.min) {
        const taxableAtThisBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
        const taxAtThisBracket = taxableAtThisBracket * (bracket.rate / 100);
        taxAmount += taxAtThisBracket;
        
        if (taxAtThisBracket > 0) {
          bracketDetails.push({
            range: `${bracket.min.toLocaleString()} - ${bracket.max === Infinity ? 'ขึ้นไป' : bracket.max.toLocaleString()}`,
            rate: bracket.rate,
            amount: taxAtThisBracket
          });
        }
      }
    }
    
    return {
      taxableIncome,
      taxAmount,
      netIncome: annualIncome - taxAmount - socialSecurity,
      socialSecurity,
      deductions,
      taxBrackets: bracketDetails
    };
  }

  // Tax calculation API
  app.get("/api/tax-calculation", async (req, res) => {
    try {
      const month = req.query.month as string || new Date().toISOString().slice(0, 7);
      const year = month.split('-')[0];
      
      // ดึงรายได้ประจำปี
      const transactions = await storage.getTransactions();
      const yearlyTransactions = transactions.filter(t => 
        t.date.startsWith(year) && t.type === "income"
      );
      
      const annualIncome = yearlyTransactions
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const taxCalculation = calculateThaiTax(annualIncome);
      
      res.json({
        year: parseInt(year),
        annualIncome,
        ...taxCalculation,
        monthlyAverage: {
          grossIncome: annualIncome / 12,
          netIncome: taxCalculation.netIncome / 12,
          tax: taxCalculation.taxAmount / 12,
          socialSecurity: taxCalculation.socialSecurity / 12
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate tax" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/summary", async (req, res) => {
    try {
      const transactions = await storage.getTransactions();
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      const monthlyTransactions = transactions.filter(t => 
        t.date.startsWith(currentMonth)
      );

      const totalIncome = monthlyTransactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const totalExpenses = monthlyTransactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const balance = totalIncome - totalExpenses;

      // Category breakdown
      const categoryBreakdown = monthlyTransactions
        .filter(t => t.type === "expense")
        .reduce((acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
          return acc;
        }, {} as Record<string, number>);

      res.json({
        totalIncome,
        totalExpenses,
        balance,
        categoryBreakdown,
        transactionCount: monthlyTransactions.length
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
