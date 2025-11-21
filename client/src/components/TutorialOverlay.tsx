import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useTutorial } from '@/hooks/useTutorial';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

export function TutorialOverlay() {
  const {
    isActive,
    currentStep,
    currentStepData,
    totalSteps,
    nextStep,
    previousStep,
    skipTutorial,
  } = useTutorial();

  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!isActive || !currentStepData) return;

    const updatePosition = () => {
      const targetElement = document.querySelector(currentStepData.target);
      if (!targetElement) {
        // If target not found, center the overlay
        setPosition({
          top: window.innerHeight / 2 - 150,
          left: window.innerWidth / 2 - 200,
        });
        setHighlightRect(null);
        return;
      }

      const rect = targetElement.getBoundingClientRect();
      setHighlightRect(rect);

      let top = 0;
      let left = 0;

      switch (currentStepData.position) {
        case 'top':
          top = rect.top - 220;
          left = rect.left + rect.width / 2 - 200;
          break;
        case 'bottom':
          top = rect.bottom + 20;
          left = rect.left + rect.width / 2 - 200;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - 100;
          left = rect.left - 420;
          break;
        case 'right':
          top = rect.top + rect.height / 2 - 100;
          left = rect.right + 20;
          break;
      }

      // Ensure overlay stays within viewport
      top = Math.max(20, Math.min(top, window.innerHeight - 220));
      left = Math.max(20, Math.min(left, window.innerWidth - 420));

      setPosition({ top, left });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isActive, currentStepData]);

  if (!isActive || !currentStepData) return null;

  return (
    <>
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={skipTutorial} />

      {/* Highlight spotlight */}
      {highlightRect && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            top: highlightRect.top - 4,
            left: highlightRect.left - 4,
            width: highlightRect.width + 8,
            height: highlightRect.height + 8,
            boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.5)',
            borderRadius: '8px',
            transition: 'all 0.3s ease',
          }}
        />
      )}

      {/* Tutorial card */}
      <Card
        className="fixed z-[10000] w-[400px] shadow-2xl"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          transition: 'all 0.3s ease',
        }}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{currentStepData.title}</CardTitle>
              <CardDescription className="text-xs mt-1">
                Step {currentStep + 1} of {totalSteps}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1"
              onClick={skipTutorial}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{currentStepData.description}</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={previousStep}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  idx === currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <Button size="sm" onClick={nextStep}>
            {currentStep === totalSteps - 1 ? 'Finish' : 'Next'}
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
