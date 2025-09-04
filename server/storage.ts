import { 
  type Transaction, 
  type InsertTransaction,
  type Category,
  type InsertCategory,
  type Budget,
  type InsertBudget,
  type Goal,
  type InsertGoal,
  transactions,
  categories,
  budgets,
  goals
} from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc } from "drizzle-orm";

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
      createdAt: new Date(),
      deadline: insertGoal.deadline || null
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

// PostgreSQL Storage Implementation
export class PostgresStorage implements IStorage {
  private db: any;

  constructor(connectionString: string) {
    // Configure neon client with SSL settings
    const sql = neon(connectionString, {
      arrayMode: false,
      fullResults: false,
      fetchOptions: {
        headers: {},
      },
    });
    this.db = drizzle(sql);
  }

  // Transaction methods
  async getTransactions(): Promise<Transaction[]> {
    return await this.db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.date));
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const result = await this.db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1);
    return result[0] || undefined;
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const result = await this.db
      .insert(transactions)
      .values(insertTransaction)
      .returning();
    return result[0];
  }

  async updateTransaction(id: string, updates: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const result = await this.db
      .update(transactions)
      .set(updates)
      .where(eq(transactions.id, id))
      .returning();
    return result[0] || undefined;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    const result = await this.db
      .delete(transactions)
      .where(eq(transactions.id, id))
      .returning({ id: transactions.id });
    return result.length > 0;
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return await this.db.select().from(categories);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const result = await this.db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    return result[0] || undefined;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const result = await this.db
      .insert(categories)
      .values(insertCategory)
      .returning();
    return result[0];
  }

  // Budget methods
  async getBudgets(): Promise<Budget[]> {
    return await this.db.select().from(budgets);
  }

  async getBudgetsByMonth(month: string): Promise<Budget[]> {
    return await this.db
      .select()
      .from(budgets)
      .where(eq(budgets.month, month));
  }

  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    const result = await this.db
      .insert(budgets)
      .values(insertBudget)
      .returning();
    return result[0];
  }

  async updateBudget(id: string, updates: Partial<Budget>): Promise<Budget | undefined> {
    const result = await this.db
      .update(budgets)
      .set(updates)
      .where(eq(budgets.id, id))
      .returning();
    return result[0] || undefined;
  }

  // Goal methods
  async getGoals(): Promise<Goal[]> {
    return await this.db.select().from(goals);
  }

  async getGoal(id: string): Promise<Goal | undefined> {
    const result = await this.db
      .select()
      .from(goals)
      .where(eq(goals.id, id))
      .limit(1);
    return result[0] || undefined;
  }

  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const result = await this.db
      .insert(goals)
      .values(insertGoal)
      .returning();
    return result[0];
  }

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal | undefined> {
    const result = await this.db
      .update(goals)
      .set(updates)
      .where(eq(goals.id, id))
      .returning();
    return result[0] || undefined;
  }

  async deleteGoal(id: string): Promise<boolean> {
    const result = await this.db
      .delete(goals)
      .where(eq(goals.id, id))
      .returning({ id: goals.id });
    return result.length > 0;
  }

  // Initialize default categories for new database
  async initializeDefaultCategories(): Promise<void> {
    const existingCategories = await this.getCategories();
    if (existingCategories.length > 0) return;

    const defaultCategories: InsertCategory[] = [
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

    for (const category of defaultCategories) {
      await this.createCategory(category);
    }
  }
}

// Create storage instance based on environment
function createStorage(): IStorage {
  const databaseUrl = process.env.DATABASE_URL;
  
  // Temporarily force in-memory storage for stable demo
  // Remove this condition to re-enable PostgreSQL when database is ready
  if (false && databaseUrl) {
    console.log('Using PostgreSQL database');
    try {
      const storage = new PostgresStorage(databaseUrl);
      // Initialize default categories in the background
      storage.initializeDefaultCategories().catch((error) => {
        console.error('Failed to initialize default categories:', error.message);
        console.log('Database connection may not be ready. Categories will be created when needed.');
      });
      return storage;
    } catch (error) {
      console.error('Failed to create PostgreSQL storage:', error);
      console.log('Falling back to in-memory storage');
      return new MemStorage();
    }
  } else {
    console.log('Using in-memory storage (reliable demo mode)');
    return new MemStorage();
  }
}

export const storage = createStorage();
