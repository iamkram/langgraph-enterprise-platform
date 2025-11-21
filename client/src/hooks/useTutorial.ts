import { useEffect, useState } from 'react';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector for highlighting
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: 'click' | 'navigate';
}

const TUTORIAL_STORAGE_KEY = 'aim_tutorial_completed';
const TUTORIAL_ACTIVE_KEY = 'aim_tutorial_active';

export const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to AIM! 🎯',
    description: 'Let\'s create your first intelligent agent in 60 seconds. Click "Next" to begin.',
    target: 'body',
    position: 'bottom',
  },
  {
    id: 'templates',
    title: 'Start with a Template',
    description: 'Browse pre-configured agent templates for common use cases. Click the "Templates" button to explore.',
    target: '[data-tutorial="templates-button"]',
    position: 'bottom',
    action: 'click',
  },
  {
    id: 'select-template',
    title: 'Choose Your Agent Type',
    description: 'Select a template that matches your needs. Each template comes with pre-configured workers and tools.',
    target: '[data-tutorial="template-card"]',
    position: 'right',
  },
  {
    id: 'clone-template',
    title: 'Clone the Template',
    description: 'Click "Use This Template" to start customizing it for your needs.',
    target: '[data-tutorial="clone-button"]',
    position: 'bottom',
    action: 'click',
  },
  {
    id: 'wizard-step1',
    title: 'Configure Basic Info',
    description: 'Give your agent a name and description. These help you identify and organize your agents.',
    target: '[data-tutorial="wizard-step1"]',
    position: 'right',
  },
  {
    id: 'wizard-complete',
    title: 'Review and Create',
    description: 'Review your configuration and click "Create Agent" to generate your intelligent agent!',
    target: '[data-tutorial="create-button"]',
    position: 'top',
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🎉',
    description: 'Your agent is ready! You can view the generated code, test it, or create more agents.',
    target: 'body',
    position: 'bottom',
  },
];

export function useTutorial() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    // Check if tutorial has been completed
    const completed = localStorage.getItem(TUTORIAL_STORAGE_KEY) === 'true';
    setIsCompleted(completed);

    // Check if tutorial is currently active
    const active = sessionStorage.getItem(TUTORIAL_ACTIVE_KEY) === 'true';
    setIsActive(active && !completed);
  }, []);

  const startTutorial = () => {
    setIsActive(true);
    setCurrentStep(0);
    sessionStorage.setItem(TUTORIAL_ACTIVE_KEY, 'true');
  };

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTutorial = () => {
    setIsActive(false);
    sessionStorage.removeItem(TUTORIAL_ACTIVE_KEY);
  };

  const completeTutorial = () => {
    setIsActive(false);
    setIsCompleted(true);
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    sessionStorage.removeItem(TUTORIAL_ACTIVE_KEY);
  };

  const resetTutorial = () => {
    setIsCompleted(false);
    localStorage.removeItem(TUTORIAL_STORAGE_KEY);
    sessionStorage.removeItem(TUTORIAL_ACTIVE_KEY);
  };

  return {
    isActive,
    currentStep,
    isCompleted,
    currentStepData: tutorialSteps[currentStep],
    totalSteps: tutorialSteps.length,
    startTutorial,
    nextStep,
    previousStep,
    skipTutorial,
    completeTutorial,
    resetTutorial,
  };
}
