import { Button } from "@/components/ui/button";

interface HeaderProps {
  onNewTransaction: () => void;
}

export default function Header({ onNewTransaction }: HeaderProps) {
  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <i className="fas fa-chart-line text-primary-foreground text-sm"></i>
          </div>
          <h1 className="text-xl font-semibold text-foreground">Personal Finance Manager</h1>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-export"
          >
            <i className="fas fa-download mr-2"></i>Export
          </Button>
          <Button 
            onClick={onNewTransaction}
            size="sm"
            data-testid="button-new-transaction"
          >
            <i className="fas fa-plus mr-2"></i>New Transaction
          </Button>
        </div>
      </div>
    </header>
  );
}
