import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useGoals } from "@/hooks/use-goals";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function GoalsView() {
  const { data: goals = [] } = useGoals();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: "",
    targetAmount: "",
    deadline: "",
    icon: "fas fa-target"
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createGoal = useMutation({
    mutationFn: async (data: typeof newGoal) => {
      return apiRequest("POST", "/api/goals", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      setIsModalOpen(false);
      setNewGoal({ title: "", targetAmount: "", deadline: "", icon: "fas fa-target" });
      toast({
        title: "Success",
        description: "Goal created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create goal",
        variant: "destructive",
      });
    },
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<any> }) => {
      return apiRequest("PUT", `/api/goals/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({
        title: "Success",
        description: "Goal updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update goal",
        variant: "destructive",
      });
    },
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/goals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({
        title: "Success",
        description: "Goal deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete goal",
        variant: "destructive",
      });
    },
  });

  const handleCreateGoal = () => {
    if (!newGoal.title || !newGoal.targetAmount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createGoal.mutate(newGoal);
  };

  const handleAddAmount = (goalId: string, currentAmount: string, addAmount: string) => {
    const newAmount = parseFloat(currentAmount) + parseFloat(addAmount);
    updateGoal.mutate({
      id: goalId,
      data: { currentAmount: newAmount.toString() }
    });
  };

  const getProgressPercentage = (current: string, target: string) => {
    const currentAmount = parseFloat(current);
    const targetAmount = parseFloat(target);
    return targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
  };

  const getTimeRemaining = (deadline?: string | null) => {
    if (!deadline) return "No deadline set";
    
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    
    if (diffMonths <= 0) return "Deadline passed";
    if (diffMonths === 1) return "1 month remaining";
    return `${diffMonths} months remaining`;
  };

  const iconOptions = [
    { value: "fas fa-piggy-bank", label: "Piggy Bank" },
    { value: "fas fa-plane", label: "Travel" },
    { value: "fas fa-home", label: "House" },
    { value: "fas fa-car", label: "Car" },
    { value: "fas fa-graduation-cap", label: "Education" },
    { value: "fas fa-ring", label: "Wedding" },
    { value: "fas fa-laptop", label: "Technology" },
    { value: "fas fa-heart", label: "Health" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">เป้าหมายทางการเงิน</h2>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-goal">
              <i className="fas fa-plus mr-2"></i>เป้าหมายใหม่
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-new-goal">
            <DialogHeader>
              <DialogTitle>สร้างเป้าหมายทางการเงิน</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="goal-title">ชื่อเป้าหมาย</Label>
                <Input
                  id="goal-title"
                  placeholder="กองทุนฉุกเฉิน"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                  data-testid="input-goal-title"
                />
              </div>
              <div>
                <Label htmlFor="goal-amount">เป้าหมายจำนวน</Label>
                <Input
                  id="goal-amount"
                  type="number"
                  step="0.01"
                  placeholder="5000.00"
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, targetAmount: e.target.value }))}
                  data-testid="input-goal-amount"
                />
              </div>
              <div>
                <Label htmlFor="goal-deadline">กำหนดเวลา (ไม่บังคับ)</Label>
                <Input
                  id="goal-deadline"
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, deadline: e.target.value }))}
                  data-testid="input-goal-deadline"
                />
              </div>
              <div>
                <Label htmlFor="goal-icon">ไอคอน</Label>
                <select
                  id="goal-icon"
                  className="w-full p-2 border border-input rounded-md bg-background"
                  value={newGoal.icon}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, icon: e.target.value }))}
                  data-testid="select-goal-icon"
                >
                  {iconOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <Button 
                onClick={handleCreateGoal}
                disabled={createGoal.isPending}
                className="w-full"
                data-testid="button-create-goal"
              >
                {createGoal.isPending ? "กำลังสร้าง..." : "สร้างเป้าหมาย"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const progressPercentage = getProgressPercentage(goal.currentAmount, goal.targetAmount);
          const timeRemaining = getTimeRemaining(goal.deadline);
          
          return (
            <Card key={goal.id} className="relative" data-testid={`goal-card-${goal.title.toLowerCase().replace(/ /g, '-')}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{goal.title}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <i className={`${goal.icon} text-primary`}></i>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteGoal.mutate(goal.id)}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      data-testid={`button-delete-goal-${goal.title.toLowerCase().replace(/ /g, '-')}`}
                    >
                      <i className="fas fa-trash text-xs"></i>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ความคืบหน้า</span>
                  <span className="font-medium" data-testid={`text-goal-progress-${goal.title.toLowerCase().replace(/ /g, '-')}`}>
                    ${parseFloat(goal.currentAmount).toFixed(2)} / ${parseFloat(goal.targetAmount).toFixed(2)}
                  </span>
                </div>
                <Progress value={Math.min(100, progressPercentage)} className="h-3" />
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">{timeRemaining}</span>
                  <span className="font-medium text-primary">
                    {progressPercentage.toFixed(1)}%
                  </span>
                </div>
                
                {/* Add Amount Section */}
                <div className="pt-2 border-t">
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="เพิ่มจำนวน"
                      className="flex-1"
                      id={`add-amount-${goal.id}`}
                      data-testid={`input-add-amount-${goal.title.toLowerCase().replace(/ /g, '-')}`}
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        const input = document.getElementById(`add-amount-${goal.id}`) as HTMLInputElement;
                        if (input?.value) {
                          handleAddAmount(goal.id, goal.currentAmount, input.value);
                          input.value = "";
                        }
                      }}
                      data-testid={`button-add-amount-${goal.title.toLowerCase().replace(/ /g, '-')}`}
                    >
                      เพิ่ม
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Add New Goal Card */}
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center min-h-[250px]">
            <i className="fas fa-plus text-4xl text-muted-foreground mb-3"></i>
            <h4 className="font-semibold mb-2">เพิ่มเป้าหมายใหม่</h4>
            <p className="text-sm text-muted-foreground mb-4">ตั้งเป้าหมายทางการเงินใหม่</p>
            <Button onClick={() => setIsModalOpen(true)} data-testid="button-add-goal-card">
              สร้างเป้าหมาย
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
