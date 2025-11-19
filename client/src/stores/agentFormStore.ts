import { create } from 'zustand';

export interface ToolConfig {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface AgentFormState {
  // Step 1: Basic Information
  name: string;
  description: string;
  agentType: 'supervisor' | 'worker' | 'custom';
  
  // Step 2: Worker Configuration
  workerAgents: string[];
  
  // Step 3: Tool Selection
  tools: ToolConfig[];
  
  // Step 4: Security & Advanced Settings
  securityEnabled: boolean;
  checkpointingEnabled: boolean;
  modelName: string;
  systemPrompt: string;
  maxIterations: number;
  maxRetries: number;
  
  // Form navigation
  currentStep: number;
  
  // Actions
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  setAgentType: (type: 'supervisor' | 'worker' | 'custom') => void;
  setWorkerAgents: (agents: string[]) => void;
  addWorkerAgent: (agent: string) => void;
  removeWorkerAgent: (agent: string) => void;
  setTools: (tools: ToolConfig[]) => void;
  addTool: (tool: ToolConfig) => void;
  removeTool: (toolName: string) => void;
  setSecurityEnabled: (enabled: boolean) => void;
  setCheckpointingEnabled: (enabled: boolean) => void;
  setModelName: (model: string) => void;
  setSystemPrompt: (prompt: string) => void;
  setMaxIterations: (max: number) => void;
  setMaxRetries: (max: number) => void;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  resetForm: () => void;
}

const initialState = {
  name: '',
  description: '',
  agentType: 'supervisor' as const,
  workerAgents: [],
  tools: [],
  securityEnabled: true,
  checkpointingEnabled: true,
  modelName: 'gpt-4o',
  systemPrompt: '',
  maxIterations: 10,
  maxRetries: 3,
  currentStep: 1,
};

export const useAgentFormStore = create<AgentFormState>((set) => ({
  ...initialState,
  
  setName: (name) => set({ name }),
  setDescription: (description) => set({ description }),
  setAgentType: (agentType) => set({ agentType }),
  
  setWorkerAgents: (workerAgents) => set({ workerAgents }),
  addWorkerAgent: (agent) => set((state) => ({
    workerAgents: [...state.workerAgents, agent]
  })),
  removeWorkerAgent: (agent) => set((state) => ({
    workerAgents: state.workerAgents.filter(a => a !== agent)
  })),
  
  setTools: (tools) => set({ tools }),
  addTool: (tool) => set((state) => ({
    tools: [...state.tools, tool]
  })),
  removeTool: (toolName) => set((state) => ({
    tools: state.tools.filter(t => t.name !== toolName)
  })),
  
  setSecurityEnabled: (securityEnabled) => set({ securityEnabled }),
  setCheckpointingEnabled: (checkpointingEnabled) => set({ checkpointingEnabled }),
  setModelName: (modelName) => set({ modelName }),
  setSystemPrompt: (systemPrompt) => set({ systemPrompt }),
  setMaxIterations: (maxIterations) => set({ maxIterations }),
  setMaxRetries: (maxRetries) => set({ maxRetries }),
  
  setCurrentStep: (currentStep) => set({ currentStep }),
  nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 5) })),
  previousStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),
  
  resetForm: () => set(initialState),
}));
