import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useCategories } from "@/hooks/use-categories";

export default function Sidebar() {
  const { data: categories = [] } = useCategories();
  
  const { data: summary } = useQuery({
    queryKey: ["/api/analytics/summary"],
  });

  return (
    <aside className="w-80 bg-card border-r border-border flex flex-col">
      {/* Summary Cards */}
      <div className="p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">ภาพรวม</h2>
        <div className="grid grid-cols-1 gap-3">
          <Card className="bg-background rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">เดือนนี้</p>
                <p className="text-2xl font-bold text-success" data-testid="text-monthly-balance">
                  {summary?.balance >= 0 ? '+' : ''}฿{summary?.balance?.toLocaleString('th-TH', { minimumFractionDigits: 2 }) || '0.00'}
                </p>
              </div>
              <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                <i className={`fas ${summary?.balance >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'} text-success`}></i>
              </div>
            </div>
          </Card>
          
          <Card className="bg-background rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">รายได้รวม</p>
                <p className="text-xl font-semibold text-success" data-testid="text-total-income">
                  ฿{summary?.totalIncome?.toLocaleString('th-TH', { minimumFractionDigits: 2 }) || '0.00'}
                </p>
              </div>
              <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center">
                <i className="fas fa-plus text-success text-sm"></i>
              </div>
            </div>
          </Card>

          <Card className="bg-background rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ค่าใช้จ่ายรวม</p>
                <p className="text-xl font-semibold text-destructive" data-testid="text-total-expenses">
                  -฿{summary?.totalExpenses?.toLocaleString('th-TH', { minimumFractionDigits: 2 }) || '0.00'}
                </p>
              </div>
              <div className="w-8 h-8 bg-destructive/10 rounded-full flex items-center justify-center">
                <i className="fas fa-minus text-destructive text-sm"></i>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Categories */}
      <div className="p-6 flex-1">
        <h3 className="text-md font-semibold text-foreground mb-4">หมวดหมู่</h3>
        <div className="space-y-2">
          {Object.entries(summary?.categoryBreakdown || {}).map(([category, amount]) => {
            const categoryData = categories.find(c => c.name === category);
            return (
              <div key={category} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                    <i className={`${categoryData?.icon || 'fas fa-circle'} text-primary text-xs`}></i>
                  </div>
                  <span className="text-sm text-foreground" data-testid={`text-category-${category.toLowerCase().replace(/ /g, '-')}`}>
                    {category}
                  </span>
                </div>
                <span className="text-sm font-mono text-destructive">
                  -฿{(amount as number).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
