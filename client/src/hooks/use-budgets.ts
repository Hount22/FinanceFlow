import { useQuery } from "@tanstack/react-query";
import type { Budget } from "@shared/schema";

export function useBudgets(month?: string) {
  return useQuery<Budget[]>({
    queryKey: month ? ["/api/budgets", { month }] : ["/api/budgets"],
  });
}
