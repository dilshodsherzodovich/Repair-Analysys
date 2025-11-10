"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { EnhancedButton } from "./enhanced-button";

export interface Step {
  id: string;
  title: string;
  description?: string;
  content: React.ReactNode;
  validation?: () => boolean | Promise<boolean>;
}

export interface MultiStepFormProps {
  steps: Step[];
  onComplete?: (data: Record<string, any>) => void;
  onStepChange?: (currentStep: number, direction: "next" | "prev") => void;
  className?: string;
  showStepNumbers?: boolean;
  allowSkip?: boolean;
}

const MultiStepForm = React.forwardRef<HTMLDivElement, MultiStepFormProps>(
  (
    {
      steps,
      onComplete,
      onStepChange,
      className,
      showStepNumbers = true,
      allowSkip = false,
      ...props
    },
    ref
  ) => {
    const [currentStep, setCurrentStep] = React.useState(0);
    const [completedSteps, setCompletedSteps] = React.useState<Set<number>>(
      new Set()
    );
    const [isValidating, setIsValidating] = React.useState(false);
    const [formData, setFormData] = React.useState<Record<string, any>>({});

    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === steps.length - 1;
    const currentStepData = steps[currentStep];

    const validateCurrentStep = async (): Promise<boolean> => {
      if (!currentStepData.validation) return true;

      setIsValidating(true);
      try {
        const isValid = await currentStepData.validation();
        return isValid;
      } catch (error) {
        console.error("Step validation error:", error);
        return false;
      } finally {
        setIsValidating(false);
      }
    };

    const goToStep = async (
      stepIndex: number,
      direction: "next" | "prev" = "next"
    ) => {
      if (direction === "next" && currentStepData.validation) {
        const isValid = await validateCurrentStep();
        if (!isValid) return;
      }

      if (direction === "next") {
        setCompletedSteps((prev) => new Set([...prev, currentStep]));
      }

      setCurrentStep(stepIndex);
      onStepChange?.(stepIndex, direction);
    };

    const handleNext = () => {
      if (isLastStep) {
        handleComplete();
      } else {
        goToStep(currentStep + 1, "next");
      }
    };

    const handlePrev = () => {
      if (!isFirstStep) {
        goToStep(currentStep - 1, "prev");
      }
    };

    const handleComplete = async () => {
      const isValid = await validateCurrentStep();
      if (isValid) {
        setCompletedSteps((prev) => new Set([...prev, currentStep]));
        onComplete?.(formData);
      }
    };

    const getStepStatus = (stepIndex: number) => {
      if (completedSteps.has(stepIndex)) return "completed";
      if (stepIndex === currentStep) return "current";
      return "upcoming";
    };

    return (
      <div ref={ref} className={cn("space-y-8", className)} {...props}>
        {/* Step Indicator */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const isClickable =
              allowSkip || completedSteps.has(index) || index <= currentStep;

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center space-y-2">
                  <button
                    onClick={() => isClickable && goToStep(index)}
                    disabled={!isClickable}
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full border-1 transition-colors",
                      status === "completed"
                        ? "bg-[#10b981] border-[#10b981] text-white"
                        : status === "current"
                        ? "bg-[#2354bf] border-[#2354bf] text-white"
                        : "bg-white border-[#d1d5db] text-[#6b7280]",
                      isClickable && "hover:border-[#2354bf] cursor-pointer",
                      !isClickable && "cursor-not-allowed opacity-50"
                    )}
                  >
                    {status === "completed" ? (
                      <Check className="w-5 h-5" />
                    ) : showStepNumbers ? (
                      index + 1
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-current" />
                    )}
                  </button>
                  <div className="text-center">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        status === "current"
                          ? "text-[#2354bf]"
                          : "text-[#6b7280]"
                      )}
                    >
                      {step.title}
                    </p>
                    {step.description && (
                      <p className="text-xs text-[#9ca3af] mt-1">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-4",
                      completedSteps.has(index)
                        ? "bg-[#10b981]"
                        : "bg-[#e5e7eb]"
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          <div className="bg-white rounded-lg border p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-[#1f2937] mb-2">
                {currentStepData.title}
              </h2>
              {currentStepData.description && (
                <p className="text-[#6b7280]">{currentStepData.description}</p>
              )}
            </div>
            <div>{currentStepData.content}</div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <EnhancedButton
            variant="outline"
            onClick={handlePrev}
            disabled={isFirstStep}
            leftIcon={<ChevronLeft className="w-4 h-4" />}
          >
            Назад
          </EnhancedButton>

          <div className="text-sm text-[#6b7280] flex items-center">
            Шаг {currentStep + 1} из {steps.length}
          </div>

          <EnhancedButton
            onClick={handleNext}
            loading={isValidating}
            loadingText={isLastStep ? "Завершение..." : "Проверка..."}
            rightIcon={
              !isLastStep ? <ChevronRight className="w-4 h-4" /> : undefined
            }
          >
            {isLastStep ? "Завершить" : "Далее"}
          </EnhancedButton>
        </div>
      </div>
    );
  }
);
MultiStepForm.displayName = "MultiStepForm";

export { MultiStepForm };
