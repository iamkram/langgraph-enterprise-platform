/**
 * Validation utilities for AI-generated tool and agent specifications
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ToolSpec {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface AgentSpec {
  name: string;
  role: string;
  goal: string;
  backstory: string;
  tools: string[];
  allowDelegation: boolean;
}

/**
 * Validate a tool specification
 */
export function validateToolSpec(spec: Partial<ToolSpec>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Name validation
  if (!spec.name) {
    errors.push("Tool name is required");
  } else if (spec.name.length < 3) {
    errors.push("Tool name must be at least 3 characters");
  } else if (!/^[a-z][a-z0-9_]*$/.test(spec.name)) {
    errors.push("Tool name must be snake_case (lowercase letters, numbers, underscores only)");
  } else if (spec.name.length > 50) {
    warnings.push("Tool name is quite long (>50 characters)");
  }

  // Description validation
  if (!spec.description) {
    errors.push("Tool description is required");
  } else if (spec.description.length < 10) {
    warnings.push("Tool description is very short (<10 characters)");
  } else if (spec.description.length > 500) {
    warnings.push("Tool description is very long (>500 characters)");
  }

  // Parameters validation
  if (!spec.parameters) {
    errors.push("Tool parameters are required");
  } else {
    if (spec.parameters.type !== "object") {
      errors.push("Parameters type must be 'object'");
    }

    if (!spec.parameters.properties || Object.keys(spec.parameters.properties).length === 0) {
      warnings.push("Tool has no parameters defined");
    } else {
      // Validate each parameter
      Object.entries(spec.parameters.properties).forEach(([paramName, paramSpec]) => {
        if (!paramSpec.type) {
          errors.push(`Parameter '${paramName}' is missing a type`);
        }
        if (!paramSpec.description) {
          warnings.push(`Parameter '${paramName}' has no description`);
        }
      });
    }

    // Check for required fields
    if (spec.parameters.required && spec.parameters.required.length > 0) {
      spec.parameters.required.forEach((reqField) => {
        if (!spec.parameters!.properties[reqField]) {
          errors.push(`Required parameter '${reqField}' is not defined in properties`);
        }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate an agent specification
 */
export function validateAgentSpec(spec: Partial<AgentSpec>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Name validation
  if (!spec.name) {
    errors.push("Agent name is required");
  } else if (spec.name.length < 3) {
    errors.push("Agent name must be at least 3 characters");
  } else if (!/^[a-z][a-z0-9_]*$/.test(spec.name)) {
    errors.push("Agent name must be snake_case (lowercase letters, numbers, underscores only)");
  } else if (spec.name.length > 50) {
    warnings.push("Agent name is quite long (>50 characters)");
  }

  // Role validation
  if (!spec.role) {
    errors.push("Agent role is required");
  } else if (spec.role.length < 5) {
    warnings.push("Agent role is very short (<5 characters)");
  } else if (spec.role.length > 200) {
    warnings.push("Agent role is very long (>200 characters)");
  }

  // Goal validation
  if (!spec.goal) {
    errors.push("Agent goal is required");
  } else if (spec.goal.length < 10) {
    warnings.push("Agent goal is very short (<10 characters)");
  } else if (spec.goal.length > 500) {
    warnings.push("Agent goal is very long (>500 characters)");
  }

  // Backstory validation
  if (!spec.backstory) {
    errors.push("Agent backstory is required");
  } else if (spec.backstory.length < 20) {
    warnings.push("Agent backstory is very short (<20 characters)");
  } else if (spec.backstory.length > 1000) {
    warnings.push("Agent backstory is very long (>1000 characters)");
  }

  // Tools validation
  if (!spec.tools || spec.tools.length === 0) {
    warnings.push("Agent has no tools assigned");
  } else if (spec.tools.length > 20) {
    warnings.push("Agent has many tools (>20), which may affect performance");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Extract tool spec from LLM response
 */
export function extractToolSpecFromResponse(response: string): ToolSpec | null {
  try {
    // Try to find JSON in code blocks
    const jsonMatch = response.match(/```json\s*\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]!);
    }

    // Try to find JSON directly
    const jsonStart = response.indexOf("{");
    const jsonEnd = response.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1) {
      return JSON.parse(response.substring(jsonStart, jsonEnd + 1));
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Extract agent spec from LLM response
 */
export function extractAgentSpecFromResponse(response: string): AgentSpec | null {
  try {
    // Try to find JSON in code blocks
    const jsonMatch = response.match(/```json\s*\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]!);
    }

    // Try to find JSON directly
    const jsonStart = response.indexOf("{");
    const jsonEnd = response.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1) {
      return JSON.parse(response.substring(jsonStart, jsonEnd + 1));
    }

    return null;
  } catch (error) {
    return null;
  }
}
