import { useQuery } from "@tanstack/react-query";
import type { Goal } from "@shared/schema";

export function useGoals() {
  return useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });
}
