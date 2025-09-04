import { 
  type Transaction, 
  type InsertTransaction,
  type Category,
  type InsertCategory,
  type Budget,
  type InsertBudget,
  type Goal,
  type InsertGoal
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Transactions
  getTransactions(): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: string): Promise<boolean>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Budgets
  getBudgets(): Promise<Budget[]>;
  getBudgetsByMonth(month: string): Promise<Budget[]>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: string, budget: Partial<Budget>): Promise<Budget | undefined>;

  // Goals
  getGoals(): Promise<Goal[]>;
  getGoal(id: string): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: string, goal: Partial<Goal>): Promise<Goal | undefined>;
  deleteGoal(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private transactions: Map<string, Transaction>;
  private categories: Map<string, Category>;
  private budgets: Map<string, Budget>;
  private goals: Map<string, Goal>;

  constructor() {
    this.transactions = new Map();
    this.categories = new Map();
    this.budgets = new Map();
    this.goals = new Map();
    
    // Initialize with default categories
    this.initializeDefaultCategories();
  }

  private initializeDefaultCategories() {
    const defaultCategories: Omit<Category, 'id'>[] = [
      { name: "อาหาร", type: "expense", icon: "fas fa-utensils", color: "hsl(var(--chart-1))" },
      { name: "การเดินทาง", type: "expense", icon: "fas fa-car", color: "hsl(var(--chart-2))" },
      { name: "ที่อยู่อาศัย", type: "expense", icon: "fas fa-home", color: "hsl(var(--chart-3))" },
      { name: "ความบันเทิง", type: "expense", icon: "fas fa-film", color: "hsl(var(--chart-4))" },
      { name: "สาธารณูปโภค", type: "expense", icon: "fas fa-bolt", color: "hsl(var(--chart-5))" },
      { name: "สุขภาพ", type: "expense", icon: "fas fa-heart", color: "hsl(var(--destructive))" },
      { name: "ช้อปปิ้ง", type: "expense", icon: "fas fa-shopping-cart", color: "hsl(var(--warning))" },
      { name: "เงินเดือน", type: "income", icon: "fas fa-briefcase", color: "hsl(var(--success))" },
      { name: "งานฟรีแลนซ์", type: "income", icon: "fas fa-laptop", color: "hsl(var(--success))" },
      { name: "การลงทุน", type: "income", icon: "fas fa-chart-line", color: "hsl(var(--success))" },
    ];

    defaultCategories.forEach(category => {
      const id = randomUUID();
      this.categories.set(id, { ...category, id });
    });
  }

  // Transaction methods
  async getTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = { 
      ...insertTransaction, 
      id,
      createdAt: new Date()
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async updateTransaction(id: string, updates: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;

    const updated = { ...transaction, ...updates };
    this.transactions.set(id, updated);
    return updated;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    return this.transactions.delete(id);
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategory(id: string): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }

  // Budget methods
  async getBudgets(): Promise<Budget[]> {
    return Array.from(this.budgets.values());
  }

  async getBudgetsByMonth(month: string): Promise<Budget[]> {
    return Array.from(this.budgets.values()).filter(budget => budget.month === month);
  }

  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    const id = randomUUID();
    const budget: Budget = { ...insertBudget, id, spent: "0" };
    this.budgets.set(id, budget);
    return budget;
  }

  async updateBudget(id: string, updates: Partial<Budget>): Promise<Budget | undefined> {
    const budget = this.budgets.get(id);
    if (!budget) return undefined;

    const updated = { ...budget, ...updates };
    this.budgets.set(id, updated);
    return updated;
  }

  // Goal methods
  async getGoals(): Promise<Goal[]> {
    return Array.from(this.goals.values());
  }

  async getGoal(id: string): Promise<Goal | undefined> {
    return this.goals.get(id);
  }

  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const id = randomUUID();
    const goal: Goal = { 
      ...insertGoal, 
      id, 
      currentAmount: "0",
      createdAt: new Date()
    };
    this.goals.set(id, goal);
    return goal;
  }

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal | undefined> {
    const goal = this.goals.get(id);
    if (!goal) return undefined;

    const updated = { ...goal, ...updates };
    this.goals.set(id, updated);
    return updated;
  }

  async deleteGoal(id: string): Promise<boolean> {
    return this.goals.delete(id);
  }
}

export const storage = new MemStorage();
