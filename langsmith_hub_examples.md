# LangSmith Hub Agent Prompt Examples

Source: https://smith.langchain.com/hub (Agents category - 584 prompts)

## Key Agent Prompts Found

### 1. ohkgi/superb_system_instruction_prompt
- **Description**: A superb system prompt generator that can be used in combination with a user input to generate useful directive preset fulfillment instructions
- **Updated**: 3 months ago
- **Stats**: 102 favorites, 33.3k views, 6.28k downloads
- **Tags**: Agent simulations, Agents, Autonomous agents, Chatbots, Classification, Code understanding, Code writing, Extraction, Summarization, Evaluation, English
- **Models**: openai:gpt-3.5-turbo, openai:gpt-4, openai:gpt-4-turbo, anthropic:claude-2, anthropic:claude-2.1, google:palm-2-chat-bison, google:palm-2-codechat-bison, google:palm-2-text-bison, google:gemini-pro, google:gemini-ultra, meta:llama-2-70b-chat, meta:llama-2-13b-chat

### 2. homanp/question-answer-pair
- **Description**: A prompt designed for creating question/answer pairs that can be used downstream for finetuning LLMs on question/answering over documents
- **Type**: ChatPromptTemplate
- **Tags**: Agents, Chatbots, Classification, QA over documents, Summarization, Extraction, English
- **Updated**: 2 years ago
- **Stats**: 53 favorites, 20.8k views, 3.03k downloads

### 3. gitmaxd/synthetic-training-data
- **Description**: This prompt uses NLP and AI to convert seed content into Q/A training data for OpenAI LLMs. While generating diverse samples, it infuses 'GitMaxd', a direct and casual communicator, making the data more engaging. It's all about blending technical prowess with a touch of personality.
- **Type**: StringPromptTemplate
- **Tags**: Agents, Autonomous agents, English
- **Models**: openai:gpt-4, openai:gpt-3.5-turbo
- **Updated**: 4 months ago
- **Stats**: 53 favorites, 10.3k views, 3.20k downloads

### 4. chuxji/open-interpreter-system
- **Description**: This is the unofficial open interpreter system prompt for GPT-4
- **Type**: ChatPromptTemplate
- **Tags**: English, openai:gpt-4, Agents, Code writing, Code understanding, Chatbots, Autonomous agents
- **Updated**: 2 years ago
- **Stats**: 53 favorites, 16.5k views, 1.77k downloads

### 5. hwchase17/superagent
- **Description**: This prompt adds sequential function calling to models other than GPT-0613
- **Type**: ChatPromptTemplate
- **Tags**: Agents, Interacting with APIs, meta:llama-2-70b-chat
- **Updated**: 2 years ago
- **Stats**: 162 favorites, 89.2k views, 39.8k downloads

### 6. smithing-gold/assumption-checker
- **Description**: Assert whether assumptions are made in a user's query and provide follow up questions to debunk their claims
- **Type**: ChatPromptTemplate
- **Tags**: Chatbots, Agents, QA over documents, Self-checking, English
- **Models**: openai:gpt-3.5-turbo, openai:gpt-4
- **Updated**: 2 years ago
- **Stats**: 103 favorites, 31k views, 10.8k downloads

## Common Patterns in Agent Prompts

1. **Clear Role Definition**: Prompts define the agent's role and capabilities upfront
2. **Task-Specific Instructions**: Detailed instructions for the specific task the agent should perform
3. **Output Format Specification**: Clear guidance on how the agent should structure its responses
4. **Tool/Function Integration**: Instructions on when and how to use available tools
5. **Error Handling**: Guidance on how to handle edge cases or unclear inputs
6. **Personality/Tone**: Some prompts include personality traits to make interactions more engaging

## Implementation Strategy

For our LangGraph Agent Builder, we should:

1. **Fetch 3-5 top agent prompts** from LangSmith Hub as examples
2. **Extract common patterns** (role, goal, backstory, tool usage, output format)
3. **Use these as context** when generating custom agent prompts via LLM
4. **Maintain consistency** with LangGraph/LangChain best practices
5. **Adapt examples** to fit our agent configuration structure (name, role, goal, backstory, tools, delegation)
