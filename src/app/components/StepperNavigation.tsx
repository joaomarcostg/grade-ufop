import { Button } from "@mui/material";
import { ArrowBack, ArrowForward } from "@mui/icons-material";

interface StepperNavigationProps {
  onNext?: () => Promise<void> | void;
  onBack?: () => Promise<void> | void;
  nextLabel?: string;
  backLabel?: string;
  isLoading?: boolean;
  nextDisabled?: boolean;
  showBack?: boolean;
  nextIcon?: boolean;
  variant?: "text" | "contained" | "outlined";
}

export function StepperNavigation({
  onNext,
  onBack,
  nextLabel = "Próximo",
  backLabel = "Voltar",
  isLoading = false,
  nextDisabled = false,
  showBack = true,
  nextIcon = true,
  variant = "contained",
}: StepperNavigationProps) {
  return (
    <div className="w-full flex justify-between items-center mt-4">
      {showBack ? (
        <Button
          onClick={onBack}
          disabled={isLoading}
          startIcon={<ArrowBack />}
          sx={{ mr: 1 }}
        >
          {backLabel}
        </Button>
      ) : (
        <div />
      )}
      <Button
        variant={variant}
        onClick={onNext}
        disabled={isLoading || nextDisabled}
        endIcon={nextIcon ? <ArrowForward /> : undefined}
      >
        {nextLabel}
      </Button>
    </div>
  );
}
