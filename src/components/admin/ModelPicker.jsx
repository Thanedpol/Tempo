import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Cpu } from 'lucide-react';
import { createPortal } from 'react-dom';

const OPENROUTER_MODELS = [
  // === OpenAI ===
  { id: 'openai/gpt-4o', name: 'openai/gpt-4o', context: '128,000', price_in: '$2.500', price_out: '$10.000' },
  { id: 'openai/gpt-4o-mini', name: 'openai/gpt-4o-mini', context: '128,000', price_in: '$0.150', price_out: '$0.600' },
  { id: 'openai/gpt-4.1', name: 'openai/gpt-4.1', context: '1,047,576', price_in: '$2.000', price_out: '$8.000' },
  { id: 'openai/gpt-4.1-mini', name: 'openai/gpt-4.1-mini', context: '1,047,576', price_in: '$0.400', price_out: '$1.600' },
  { id: 'openai/gpt-4.1-nano', name: 'openai/gpt-4.1-nano', context: '1,047,576', price_in: '$0.100', price_out: '$0.400' },
  { id: 'openai/o1', name: 'openai/o1', context: '200,000', price_in: '$15.000', price_out: '$60.000' },
  { id: 'openai/o1-mini', name: 'openai/o1-mini', context: '128,000', price_in: '$1.100', price_out: '$4.400' },
  { id: 'openai/o3', name: 'openai/o3', context: '200,000', price_in: '$10.000', price_out: '$40.000' },
  { id: 'openai/o3-mini', name: 'openai/o3-mini', context: '200,000', price_in: '$1.100', price_out: '$4.400' },
  { id: 'openai/o4-mini', name: 'openai/o4-mini', context: '200,000', price_in: '$1.100', price_out: '$4.400' },
  // === Anthropic ===
  { id: 'anthropic/claude-3-haiku', name: 'anthropic/claude-3-haiku', context: '200,000', price_in: '$0.250', price_out: '$1.250' },
  { id: 'anthropic/claude-3.5-haiku', name: 'anthropic/claude-3.5-haiku', context: '200,000', price_in: '$0.800', price_out: '$4.000' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'anthropic/claude-3.5-sonnet', context: '200,000', price_in: '$3.000', price_out: '$15.000' },
  { id: 'anthropic/claude-3.7-sonnet', name: 'anthropic/claude-3.7-sonnet', context: '200,000', price_in: '$3.000', price_out: '$15.000' },
  { id: 'anthropic/claude-opus-4', name: 'anthropic/claude-opus-4', context: '200,000', price_in: '$15.000', price_out: '$75.000' },
  { id: 'anthropic/claude-sonnet-4', name: 'anthropic/claude-sonnet-4', context: '200,000', price_in: '$3.000', price_out: '$15.000' },
  // === Google ===
  { id: 'google/gemini-2.0-flash-001', name: 'google/gemini-2.0-flash-001', context: '1,048,576', price_in: '$0.100', price_out: '$0.400' },
  { id: 'google/gemini-2.0-flash-lite-001', name: 'google/gemini-2.0-flash-lite-001', context: '1,048,576', price_in: '$0.075', price_out: '$0.300' },
  { id: 'google/gemini-2.5-flash-preview', name: 'google/gemini-2.5-flash-preview', context: '1,048,576', price_in: '$0.150', price_out: '$0.600' },
  { id: 'google/gemini-2.5-pro-preview', name: 'google/gemini-2.5-pro-preview', context: '1,048,576', price_in: '$1.250', price_out: '$10.000' },
  { id: 'google/gemini-flash-1.5', name: 'google/gemini-flash-1.5', context: '1,000,000', price_in: '$0.075', price_out: '$0.300' },
  { id: 'google/gemini-pro-1.5', name: 'google/gemini-pro-1.5', context: '2,000,000', price_in: '$1.250', price_out: '$5.000' },
  { id: 'google/gemma-4-2b', name: 'google/gemma-4-2b', context: '8,192', price_in: '$0.020', price_out: '$0.060' },
  { id: 'google/gemma-4-9b', name: 'google/gemma-4-9b', context: '8,192', price_in: '$0.080', price_out: '$0.240' },
  { id: 'google/gemma-4-27b', name: 'google/gemma-4-27b', context: '8,192', price_in: '$0.270', price_out: '$0.810' },
  // === Meta Llama ===
  { id: 'meta-llama/llama-3.1-8b-instruct', name: 'meta-llama/llama-3.1-8b-instruct', context: '131,072', price_in: '$0.018', price_out: '$0.018' },
  { id: 'meta-llama/llama-3.1-70b-instruct', name: 'meta-llama/llama-3.1-70b-instruct', context: '131,072', price_in: '$0.350', price_out: '$0.400' },
  { id: 'meta-llama/llama-3.1-405b-instruct', name: 'meta-llama/llama-3.1-405b-instruct', context: '131,072', price_in: '$2.000', price_out: '$2.000' },
  { id: 'meta-llama/llama-3.2-1b-instruct', name: 'meta-llama/llama-3.2-1b-instruct', context: '131,072', price_in: '$0.010', price_out: '$0.010' },
  { id: 'meta-llama/llama-3.2-3b-instruct', name: 'meta-llama/llama-3.2-3b-instruct', context: '131,072', price_in: '$0.015', price_out: '$0.015' },
  { id: 'meta-llama/llama-3.2-11b-vision-instruct', name: 'meta-llama/llama-3.2-11b-vision-instruct', context: '131,072', price_in: '$0.055', price_out: '$0.055' },
  { id: 'meta-llama/llama-3.2-90b-vision-instruct', name: 'meta-llama/llama-3.2-90b-vision-instruct', context: '131,072', price_in: '$0.900', price_out: '$0.900' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'meta-llama/llama-3.3-70b-instruct', context: '131,072', price_in: '$0.120', price_out: '$0.300' },
  { id: 'meta-llama/llama-4-maverick', name: 'meta-llama/llama-4-maverick', context: '524,288', price_in: '$0.190', price_out: '$0.850' },
  { id: 'meta-llama/llama-4-scout', name: 'meta-llama/llama-4-scout', context: '524,288', price_in: '$0.080', price_out: '$0.300' },
  // === Mistral ===
  { id: 'mistralai/mistral-7b-instruct', name: 'mistralai/mistral-7b-instruct', context: '32,768', price_in: '$0.030', price_out: '$0.050' },
  { id: 'mistralai/mistral-small-3.1-24b-instruct', name: 'mistralai/mistral-small-3.1-24b-instruct', context: '131,072', price_in: '$0.100', price_out: '$0.300' },
  { id: 'mistralai/mistral-medium-3', name: 'mistralai/mistral-medium-3', context: '131,072', price_in: '$0.400', price_out: '$2.000' },
  { id: 'mistralai/mistral-large-2411', name: 'mistralai/mistral-large-2411', context: '131,072', price_in: '$2.000', price_out: '$6.000' },
  { id: 'mistralai/mixtral-8x7b-instruct', name: 'mistralai/mixtral-8x7b-instruct', context: '32,768', price_in: '$0.240', price_out: '$0.240' },
  { id: 'mistralai/mixtral-8x22b-instruct', name: 'mistralai/mixtral-8x22b-instruct', context: '65,536', price_in: '$0.900', price_out: '$0.900' },
  { id: 'mistralai/codestral-2501', name: 'mistralai/codestral-2501', context: '256,000', price_in: '$0.300', price_out: '$0.900' },
  // === DeepSeek ===
  { id: 'deepseek/deepseek-chat', name: 'deepseek/deepseek-chat', context: '64,000', price_in: '$0.140', price_out: '$0.280' },
  { id: 'deepseek/deepseek-chat-v3-0324', name: 'deepseek/deepseek-chat-v3-0324', context: '64,000', price_in: '$0.270', price_out: '$1.100' },
  { id: 'deepseek/deepseek-r1', name: 'deepseek/deepseek-r1', context: '164,000', price_in: '$0.550', price_out: '$2.190' },
  { id: 'deepseek/deepseek-r1-distill-llama-70b', name: 'deepseek/deepseek-r1-distill-llama-70b', context: '131,072', price_in: '$0.230', price_out: '$0.690' },
  { id: 'deepseek/deepseek-r1-distill-qwen-32b', name: 'deepseek/deepseek-r1-distill-qwen-32b', context: '131,072', price_in: '$0.120', price_out: '$0.180' },
  // === Qwen ===
  { id: 'qwen/qwen-2.5-7b-instruct', name: 'qwen/qwen-2.5-7b-instruct', context: '131,072', price_in: '$0.030', price_out: '$0.050' },
  { id: 'qwen/qwen-2.5-72b-instruct', name: 'qwen/qwen-2.5-72b-instruct', context: '131,072', price_in: '$0.350', price_out: '$0.400' },
  { id: 'qwen/qwen-2.5-coder-32b-instruct', name: 'qwen/qwen-2.5-coder-32b-instruct', context: '131,072', price_in: '$0.070', price_out: '$0.160' },
  { id: 'qwen/qwen3-8b', name: 'qwen/qwen3-8b', context: '131,072', price_in: '$0.040', price_out: '$0.100' },
  { id: 'qwen/qwen3-14b', name: 'qwen/qwen3-14b', context: '131,072', price_in: '$0.070', price_out: '$0.160' },
  { id: 'qwen/qwen3-30b-a3b', name: 'qwen/qwen3-30b-a3b', context: '131,072', price_in: '$0.100', price_out: '$0.300' },
  { id: 'qwen/qwen3-32b', name: 'qwen/qwen3-32b', context: '131,072', price_in: '$0.100', price_out: '$0.300' },
  { id: 'qwen/qwen3-235b-a22b', name: 'qwen/qwen3-235b-a22b', context: '131,072', price_in: '$0.140', price_out: '$0.600' },
  // === Others ===
  { id: 'microsoft/phi-4', name: 'microsoft/phi-4', context: '16,384', price_in: '$0.070', price_out: '$0.140' },
  { id: 'microsoft/phi-4-reasoning-plus', name: 'microsoft/phi-4-reasoning-plus', context: '32,768', price_in: '$0.070', price_out: '$0.350' },
  { id: 'cohere/command-r-plus-08-2024', name: 'cohere/command-r-plus-08-2024', context: '128,000', price_in: '$2.500', price_out: '$10.000' },
  { id: 'cohere/command-r-08-2024', name: 'cohere/command-r-08-2024', context: '128,000', price_in: '$0.150', price_out: '$0.600' },
  { id: 'x-ai/grok-2', name: 'x-ai/grok-2', context: '131,072', price_in: '$2.000', price_out: '$10.000' },
  { id: 'x-ai/grok-3-beta', name: 'x-ai/grok-3-beta', context: '131,072', price_in: '$3.000', price_out: '$15.000' },
  { id: 'x-ai/grok-3-mini-beta', name: 'x-ai/grok-3-mini-beta', context: '131,072', price_in: '$0.300', price_out: '$0.500' },
  { id: 'nvidia/llama-3.1-nemotron-70b-instruct', name: 'nvidia/llama-3.1-nemotron-70b-instruct', context: '131,072', price_in: '$0.350', price_out: '$0.400' },
  { id: 'nvidia/llama-3.1-nemotron-70b-chat', name: 'nvidia/llama-3.1-nemotron-70b-chat', context: '131,072', price_in: '$0.350', price_out: '$0.400' },
  { id: 'nvidia/llama-3.2-nv-embed-1b-instruct', name: 'nvidia/llama-3.2-nv-embed-1b-instruct', context: '32,768', price_in: '$0.020', price_out: '$0.020' },
  // === Free Models (อัปเดต พ.ค. 2026 — ยังใช้งานได้จริง) ===
  // ⭐ แนะนำสำหรับ AI Assistant (ภาษาไทย + JSON)
  { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'meta-llama/llama-3.1-8b-instruct:free ⭐ แนะนำ', context: '131,072', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'meta-llama/llama-3.3-70b-instruct:free ⭐ แนะนำ', context: '131,072', price_in: '$0.000', price_out: '$0.000', free: true },

  { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'meta-llama/llama-3.2-3b-instruct:free', context: '131,072', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'google/gemma-4-31b-it:free', name: 'google/gemma-4-31b-it:free ⭐ แนะนำ', context: '262,144', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'google/gemma-4-26b-a4b-it:free', name: 'google/gemma-4-26b-a4b-it:free', context: '262,144', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'google/gemma-3-27b-it:free', name: 'google/gemma-3-27b-it:free', context: '131,072', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'google/gemma-3-12b-it:free', name: 'google/gemma-3-12b-it:free', context: '33,000', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'google/gemma-3-4b-it:free', name: 'google/gemma-3-4b-it:free', context: '33,000', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'google/gemini-2.0-flash-exp:free', context: '1,048,576', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'deepseek/deepseek-chat:free', name: 'deepseek/deepseek-chat:free', context: '64,000', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'deepseek/deepseek-r1:free', name: 'deepseek/deepseek-r1:free (reasoning)', context: '164,000', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'deepseek/deepseek-r1-distill-llama-70b:free', name: 'deepseek/deepseek-r1-distill-llama-70b:free', context: '131,072', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'qwen/qwen3-8b:free', name: 'qwen/qwen3-8b:free', context: '131,072', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'qwen/qwen3-30b-a3b:free', name: 'qwen/qwen3-30b-a3b:free', context: '131,072', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'qwen/qwen3-235b-a22b:free', name: 'qwen/qwen3-235b-a22b:free', context: '131,072', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'nvidia/nemotron-3-super-120b-a12b:free', name: 'nvidia/nemotron-3-super-120b-a12b:free', context: '262,144', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', name: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', context: '256,000', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'mistralai/mistral-7b-instruct:free', name: 'mistralai/mistral-7b-instruct:free', context: '32,768', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'microsoft/phi-4:free', name: 'microsoft/phi-4:free', context: '16,384', price_in: '$0.000', price_out: '$0.000', free: true },

  { id: 'poolside/laguna-m.1:free', name: 'poolside/laguna-m.1:free', context: '131,072', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'poolside/laguna-xs.2:free', name: 'poolside/laguna-xs.2:free', context: '131,072', price_in: '$0.000', price_out: '$0.000', free: true },
];

const OLLAMA_MODELS = [
  { id: 'ollama/llama3.2', name: 'ollama/llama3.2 (3B)', context: '131,072', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'ollama/llama3.2:1b', name: 'ollama/llama3.2:1b', context: '131,072', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'ollama/llama3.1', name: 'ollama/llama3.1 (8B)', context: '131,072', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'ollama/llama3.1:70b', name: 'ollama/llama3.1:70b', context: '131,072', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'ollama/llama3.3', name: 'ollama/llama3.3 (70B)', context: '131,072', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'ollama/llama4', name: 'ollama/llama4', context: '524,288', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'ollama/mistral', name: 'ollama/mistral (7B)', context: '32,768', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'ollama/mistral-small3.1', name: 'ollama/mistral-small3.1 (24B)', context: '131,072', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'ollama/mixtral', name: 'ollama/mixtral (8x7B)', context: '32,768', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'ollama/gemma3:1b', name: 'ollama/gemma3:1b', context: '131,072', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'ollama/gemma3', name: 'ollama/gemma3 (4B)', context: '131,072', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'ollama/gemma3:12b', name: 'ollama/gemma3:12b', context: '131,072', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'ollama/gemma3:27b', name: 'ollama/gemma3:27b', context: '131,072', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'ollama/qwen3:0.6b', name: 'ollama/qwen3:0.6b', context: '131,072', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'ollama/qwen3:1.7b', name: 'ollama/qwen3:1.7b', context: '131,072', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'ollama/qwen3:4b', name: 'ollama/qwen3:4b', context: '131,072', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'ollama/qwen3:8b', name: 'ollama/qwen3:8b', context: '131,072', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'ollama/qwen3:14b', name: 'ollama/qwen3:14b', context: '131,072', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'ollama/qwen3:30b', name: 'ollama/qwen3:30b', context: '131,072', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'ollama/qwen3:32b', name: 'ollama/qwen3:32b', context: '131,072', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'ollama/qwen2.5:7b', name: 'ollama/qwen2.5:7b', context: '131,072', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'ollama/qwen2.5:14b', name: 'ollama/qwen2.5:14b', context: '131,072', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'ollama/qwen2.5:72b', name: 'ollama/qwen2.5:72b', context: '131,072', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'ollama/qwen2.5-coder:7b', name: 'ollama/qwen2.5-coder:7b', context: '131,072', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'ollama/qwen2.5-coder:32b', name: 'ollama/qwen2.5-coder:32b', context: '131,072', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'ollama/phi4', name: 'ollama/phi4 (14B)', context: '16,384', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'ollama/phi4-mini', name: 'ollama/phi4-mini', context: '16,384', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'ollama/deepseek-r1:7b', name: 'ollama/deepseek-r1:7b', context: '131,072', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'ollama/deepseek-r1:14b', name: 'ollama/deepseek-r1:14b', context: '131,072', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'ollama/deepseek-r1:32b', name: 'ollama/deepseek-r1:32b', context: '131,072', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'ollama/deepseek-r1:70b', name: 'ollama/deepseek-r1:70b', context: '131,072', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'ollama/deepseek-v3', name: 'ollama/deepseek-v3', context: '64,000', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'ollama/codellama', name: 'ollama/codellama (7B)', context: '16,384', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'ollama/codellama:70b', name: 'ollama/codellama:70b', context: '16,384', price_in: '$0.000', price_out: '$0.000', free: true },
  { id: 'ollama/nomic-embed-text', name: 'ollama/nomic-embed-text (embed)', context: '8,192', price_in: '$0.000', price_out: '$0.000', free: true },
];

export default function ModelPicker({ value, onChange, filterPrefix = null }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState({});
  const triggerRef = useRef(null);

  const models = filterPrefix === 'ollama/'
    ? OLLAMA_MODELS
    : filterPrefix === 'openrouter/' || !filterPrefix
    ? OPENROUTER_MODELS
    : filterPrefix
    ? OPENROUTER_MODELS.filter(m => m.id.startsWith(filterPrefix))
    : OPENROUTER_MODELS;

  const filtered = models.filter(m => {
    const q = search.toLowerCase();
    if (q === 'ฟรี' || q === 'free') return m.free === true;
    return m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q);
  });

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownH = 340;
      const top = spaceBelow > dropdownH
        ? rect.bottom + 4
        : rect.top - dropdownH - 4;
      setDropdownStyle({
        position: 'fixed',
        top,
        left: rect.left,
        width: Math.min(520, window.innerWidth - rect.left - 16),
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target)) {
        const portal = document.getElementById('model-picker-portal');
        if (portal && portal.contains(e.target)) return;
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleScroll = () => updatePosition();
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [open]);

  const handleOpen = () => {
    if (!open) updatePosition();
    setOpen(!open);
  };

  const dropdown = open ? (
    <div
      id="model-picker-portal"
      style={dropdownStyle}
      className="glass neon-border rounded-2xl z-[9999] overflow-hidden shadow-2xl"
    >
      <div className="p-3 border-b border-border/30 flex items-center gap-2">
        <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <input
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="ค้นหาโมเดล..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <div className="max-h-72 overflow-y-auto scrollbar-hide">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">ไม่พบโมเดล</div>
        ) : (
          filtered.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => { onChange(m.id); setOpen(false); setSearch(''); }}
              className={`w-full flex items-center justify-between px-4 py-3 hover:bg-primary/10 transition-colors border-b border-border/10 last:border-0 text-left ${value === m.id ? 'bg-primary/15' : ''}`}
            >
              <div>
                <div className="text-sm font-mono font-medium text-foreground">{m.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">context: {m.context} tokens</div>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <div className="text-xs text-green-400">{m.price_in}/1M in</div>
                <div className="text-xs text-accent">{m.price_out}/1M out</div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  ) : null;

  return (
    <div ref={triggerRef} className="inline-block w-full">
      <button
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 transition-all text-sm font-mono font-medium"
      >
        <Cpu className="w-4 h-4 flex-shrink-0" />
        <span className="truncate flex-1 text-left">{value || 'เลือกโมเดล'}</span>
        <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {typeof document !== 'undefined' && createPortal(dropdown, document.body)}
    </div>
  );
}