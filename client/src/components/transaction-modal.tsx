import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories } from "@/hooks/use-categories";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TransactionModal({ open, onOpenChange }: TransactionModalProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: "",
    category: "",
    type: "",
    amount: ""
  });

  const { data: categories = [] } = useCategories();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createTransaction = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/transactions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
      onOpenChange(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: "",
        category: "",
        type: "",
        amount: ""
      });
      toast({
        title: "Success",
        description: "Transaction added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add transaction",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.description || !formData.category || !formData.type || !formData.amount) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    createTransaction.mutate(formData);
  };

  const filteredCategories = categories.filter(cat => 
    !formData.type || cat.type === formData.type
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="dialog-transaction-modal">
        <DialogHeader>
          <DialogTitle>เพิ่มรายการ</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="transaction-date">วันที่</Label>
            <Input
              id="transaction-date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
              data-testid="input-transaction-date"
            />
          </div>
          
          <div>
            <Label htmlFor="transaction-description">รายละเอียด</Label>
            <Input
              id="transaction-description"
              type="text"
              placeholder="ป้อนรายละเอียด..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
              data-testid="input-transaction-description"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="transaction-type">ประเภท</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value, category: "" }))}
                required
              >
                <SelectTrigger data-testid="select-transaction-type">
                  <SelectValue placeholder="เลือกประเภท" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">รายได้</SelectItem>
                  <SelectItem value="expense">รายจ่าย</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="transaction-category">หมวดหมู่</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                required
                disabled={!formData.type}
              >
                <SelectTrigger data-testid="select-transaction-category">
                  <SelectValue placeholder="เลือกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map(category => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="transaction-amount">จำนวน</Label>
            <Input
              id="transaction-amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              required
              data-testid="input-transaction-amount"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-transaction"
            >
ยกเลิก
            </Button>
            <Button 
              type="submit"
              disabled={createTransaction.isPending}
              data-testid="button-submit-transaction"
            >
              {createTransaction.isPending ? "กำลังเพิ่ม..." : "เพิ่มรายการ"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
