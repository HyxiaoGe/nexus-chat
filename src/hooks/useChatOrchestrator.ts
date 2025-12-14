import React, { useState, useRef } from 'react';
import { Message, AgentConfig, LLMProvider, TokenUsage, TokenStats } from '../types';
import { generateContentStream } from '../services/geminiService';
import { generateId, generateSmartTitle } from '../utils/common';
import { useTranslation } from 'react-i18next';
import { STORAGE_KEYS } from '../constants';
import { calculateMessageMetrics } from '../utils/messageRating';

interface UseChatOrchestratorProps {
  activeSessionId: string | null;
  agents: AgentConfig[];
  providers: LLMProvider[];
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  saveMessagesToStorage: (sessionId: string, messages: Message[]) => void;
  onScrollToBottom: () => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  updateSessionTokenUsage: (
    sessionId: string,
    tokenUsage: { totalTokens: number; totalCost: number }
  ) => void;
  showToast: (message: React.ReactNode) => void;
}

// Helper function to update global token stats
const updateGlobalTokenStats = (modelId: string, usage: TokenUsage) => {
  const statsJson = localStorage.getItem(STORAGE_KEYS.TOKEN_STATS);
  const stats: TokenStats = statsJson ? JSON.parse(statsJson) : { byModel: {} };

  if (!stats.byModel[modelId]) {
    stats.byModel[modelId] = {
      totalTokens: 0,
      totalCost: 0,
      requestCount: 0,
      lastUsed: Date.now(),
    };
  }

  stats.byModel[modelId].totalTokens += usage.totalTokens;
  stats.byModel[modelId].totalCost += usage.estimatedCost || 0;
  stats.byModel[modelId].requestCount += 1;
  stats.byModel[modelId].lastUsed = Date.now();

  localStorage.setItem(STORAGE_KEYS.TOKEN_STATS, JSON.stringify(stats));
};

export const useChatOrchestrator = ({
  activeSessionId,
  agents,
  providers,
  messages,
  setMessages,
  saveMessagesToStorage,
  onScrollToBottom,
  updateSessionTitle,
  updateSessionTokenUsage,
  showToast,
}: UseChatOrchestratorProps) => {
  const { t } = useTranslation();
  const [isStreaming, setIsStreaming] = useState(false);
  // Map to store AbortController for each message/agent
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  // Stop a specific agent by message ID
  const stopAgent = (messageId: string) => {
    const controller = abortControllersRef.current.get(messageId);
    if (controller) {
      // Find the message to get agent info
      const message = messages.find((m) => m.id === messageId);
      const agent = message ? agents.find((a) => a.id === message.agentId) : null;

      controller.abort();
      abortControllersRef.current.delete(messageId);

      // Show toast with agent name
      if (agent) {
        showToast(t('app.stoppedAgent', { agentName: agent.name }));
      }

      // Mark this specific message as done
      setMessages((prev) => {
        const final = prev.map((m) => (m.id === messageId ? { ...m, isStreaming: false } : m));
        if (activeSessionId) saveMessagesToStorage(activeSessionId, final);

        // Check if all streaming is done
        const stillStreaming = final.some((m) => m.isStreaming);
        if (!stillStreaming) {
          setIsStreaming(false);
        }

        return final;
      });
    }
  };

  // Stop all agents (global stop)
  const stopGeneration = () => {
    // Abort all controllers
    abortControllersRef.current.forEach((controller) => {
      controller.abort();
    });
    abortControllersRef.current.clear();
    setIsStreaming(false);

    // Show global stop toast
    showToast(t('app.stoppedAll'));

    // Mark all streaming messages as done
    setMessages((prev) => {
      const final = prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m));
      if (activeSessionId) saveMessagesToStorage(activeSessionId, final);
      return final;
    });
  };

  const sendMessage = async (input: string) => {
    if (!input.trim() || !activeSessionId) return;

    // Force reset streaming state if no active controllers (safety mechanism)
    if (isStreaming && abortControllersRef.current.size === 0) {
      console.warn('Detected stuck isStreaming state, force resetting...');
      setIsStreaming(false);
      // Continue execution instead of return
    } else if (isStreaming) {
      return; // Normal blocking when actually streaming
    }

    const currentInput = input.trim();

    // 1. User Message
    const userMsg: Message = {
      id: generateId(),
      sessionId: activeSessionId,
      role: 'user',
      content: currentInput,
      timestamp: Date.now(),
    };

    // 1.5. Update session title if this is the first user message
    const userMessages = messages.filter((m) => m.role === 'user');
    if (userMessages.length === 0) {
      // This is the first message, generate smart title
      const smartTitle = generateSmartTitle(currentInput);
      updateSessionTitle(activeSessionId, smartTitle);
    }

    // 2. Identify Active Agents
    const activeAgents = agents.filter((a) => a.enabled);
    if (activeAgents.length === 0) {
      const errorMsg: Message = {
        id: generateId(),
        sessionId: activeSessionId,
        role: 'model',
        content: t('app.noAgentsEnabled'),
        timestamp: Date.now(),
      };
      const updated = [...messages, userMsg, errorMsg];
      setMessages(updated);
      saveMessagesToStorage(activeSessionId, updated);
      setTimeout(onScrollToBottom, 100);
      return;
    }

    // 3. Create Placeholder Messages
    const streamStartTime = Date.now();
    const agentMessages: Message[] = activeAgents.map((agent) => ({
      id: generateId(),
      sessionId: activeSessionId,
      role: 'model',
      content: '',
      agentId: agent.id,
      timestamp: Date.now(),
      isStreaming: true,
      streamStartTime,
    }));

    const newMessagesState = [...messages, userMsg, ...agentMessages];
    setMessages(newMessagesState);
    saveMessagesToStorage(activeSessionId, newMessagesState);
    setIsStreaming(true);

    setTimeout(onScrollToBottom, 100);

    // 4. Parallel Requests - Each agent gets its own AbortController
    try {
      await Promise.all(
        activeAgents.map(async (agent, index) => {
          const messageId = agentMessages[index].id;
          const provider = providers.find((p) => p.id === agent.providerId);

          // Create individual AbortController for this agent
          const controller = new AbortController();
          abortControllersRef.current.set(messageId, controller);
          const signal = controller.signal;

          if (!provider) {
            setMessages((prev) => {
              const final = prev.map((m) =>
                m.id === messageId ? { ...m, isStreaming: false, error: t('app.configError') } : m
              );
              saveMessagesToStorage(activeSessionId, final);
              return final;
            });
            abortControllersRef.current.delete(messageId);
            return;
          }

          try {
            // Build conversation history (all previous messages except the placeholders we just added)
            const historyMessages = messages.filter(
              (m) =>
                m.role === 'user' || (m.role === 'model' && m.agentId === agent.id && m.content)
            );

            // Debug: Log conversation history
            console.log(
              `[${agent.name}] Conversation history:`,
              historyMessages.map((m) => ({
                role: m.role,
                content: m.content?.substring(0, 50) + '...',
                agentId: m.agentId,
              }))
            );

            await generateContentStream({
              agent: agent,
              provider: provider,
              prompt: currentInput,
              conversationHistory: historyMessages,
              signal: signal,
              onChunk: (text) => {
                if (signal.aborted) return;
                setMessages((prev) =>
                  prev.map((m) => (m.id === messageId ? { ...m, content: m.content + text } : m))
                );
              },
              onComplete: (usage) => {
                if (signal.aborted) return;

                // Calculate cost if pricing available
                let estimatedCost: number | undefined;
                if (usage && provider.fetchedModels) {
                  const model = provider.fetchedModels.find((m) => m.id === agent.modelId);
                  if (model && model.pricing) {
                    const promptCost =
                      (usage.promptTokens / 1_000_000) * parseFloat(model.pricing.prompt);
                    const completionCost =
                      (usage.completionTokens / 1_000_000) * parseFloat(model.pricing.completion);
                    estimatedCost = promptCost + completionCost;
                    if (usage) {
                      usage.estimatedCost = estimatedCost;
                    }
                  }
                }

                // Update global stats if usage is available
                if (usage) {
                  updateGlobalTokenStats(agent.modelId, usage);
                  // Update session-level token usage (accumulated)
                  updateSessionTokenUsage(activeSessionId, {
                    totalTokens: usage.totalTokens,
                    totalCost: usage.estimatedCost || 0,
                  });
                }

                // Update message with token usage and calculate metrics
                const streamEndTime = Date.now();
                setMessages((prev) => {
                  const final = prev.map((m) => {
                    if (m.id === messageId) {
                      const updatedMsg = {
                        ...m,
                        isStreaming: false,
                        tokenUsage: usage,
                        streamEndTime,
                      };
                      // Calculate metrics
                      const metrics = calculateMessageMetrics(updatedMsg);
                      return {
                        ...updatedMsg,
                        rating: {
                          ...m.rating,
                          metrics,
                        },
                      };
                    }
                    return m;
                  });
                  saveMessagesToStorage(activeSessionId, final);
                  return final;
                });
                abortControllersRef.current.delete(messageId);
              },
            });
          } catch (err: unknown) {
            if (signal.aborted) return;

            console.error(err);
            let errorMessage = t('common.failed');
            let isFreeTrierLimitError = false;

            if (err instanceof Error) {
              // Check for free tier limit error
              if (err.message.startsWith('FREE_TIER_LIMIT:') || err.message.startsWith('NO_FREE_TIER:')) {
                isFreeTrierLimitError = true;
                showToast(
                  `${t('app.freeTier.limitReached')}: ${t('app.freeTier.limitReachedDesc')}`
                );
              } else {
                errorMessage = err.message;
              }
            }

            setMessages((prev) => {
              const final = prev.map((m) => {
                if (m.id === messageId) {
                  // For free tier limit errors, don't show error in message bubble
                  // Just end the streaming gracefully
                  if (isFreeTrierLimitError) {
                    return { ...m, isStreaming: false };
                  }
                  return { ...m, isStreaming: false, error: errorMessage };
                }
                return m;
              });
              saveMessagesToStorage(activeSessionId, final);
              return final;
            });
            abortControllersRef.current.delete(messageId);
          }
        })
      );
    } finally {
      // Use setTimeout to ensure all onComplete/error handlers have executed
      setTimeout(() => {
        if (abortControllersRef.current.size === 0) {
          setIsStreaming(false);
        }
      }, 100);
    }
  };

  // Regenerate responses without adding a new user message
  const regenerateResponses = async (userPrompt: string) => {
    if (!userPrompt.trim() || !activeSessionId || isStreaming) return;

    const currentInput = userPrompt.trim();

    // 1. Identify Active Agents
    const activeAgents = agents.filter((a) => a.enabled);
    if (activeAgents.length === 0) {
      const errorMsg: Message = {
        id: generateId(),
        sessionId: activeSessionId,
        role: 'model',
        content: t('app.noAgentsEnabled'),
        timestamp: Date.now(),
      };
      const updated = [...messages, errorMsg];
      setMessages(updated);
      saveMessagesToStorage(activeSessionId, updated);
      setTimeout(onScrollToBottom, 100);
      return;
    }

    // 2. Create Placeholder Messages (no user message added)
    const streamStartTime = Date.now();
    const agentMessages: Message[] = activeAgents.map((agent) => ({
      id: generateId(),
      sessionId: activeSessionId,
      role: 'model',
      content: '',
      agentId: agent.id,
      timestamp: Date.now(),
      isStreaming: true,
      streamStartTime,
    }));

    // Use functional update to get the latest messages state
    setMessages((prev) => {
      const newMessagesState = [...prev, ...agentMessages];
      saveMessagesToStorage(activeSessionId, newMessagesState);
      return newMessagesState;
    });
    setIsStreaming(true);

    setTimeout(onScrollToBottom, 100);

    // 3. Parallel Requests - Each agent gets its own AbortController
    try {
      await Promise.all(
        activeAgents.map(async (agent, index) => {
          const messageId = agentMessages[index].id;
          const provider = providers.find((p) => p.id === agent.providerId);

          // Create individual AbortController for this agent
          const controller = new AbortController();
          abortControllersRef.current.set(messageId, controller);
          const signal = controller.signal;

          if (!provider) {
            setMessages((prev) => {
              const final = prev.map((m) =>
                m.id === messageId ? { ...m, isStreaming: false, error: t('app.configError') } : m
              );
              saveMessagesToStorage(activeSessionId, final);
              return final;
            });
            abortControllersRef.current.delete(messageId);
            return;
          }

          try {
            // Build conversation history (all previous messages except the placeholders we just added)
            const historyMessages = messages.filter(
              (m) =>
                m.role === 'user' || (m.role === 'model' && m.agentId === agent.id && m.content)
            );

            // Debug: Log conversation history
            console.log(
              `[${agent.name}] Conversation history:`,
              historyMessages.map((m) => ({
                role: m.role,
                content: m.content?.substring(0, 50) + '...',
                agentId: m.agentId,
              }))
            );

            await generateContentStream({
              agent: agent,
              provider: provider,
              prompt: currentInput,
              conversationHistory: historyMessages,
              signal: signal,
              onChunk: (text) => {
                if (signal.aborted) return;
                setMessages((prev) =>
                  prev.map((m) => (m.id === messageId ? { ...m, content: m.content + text } : m))
                );
              },
              onComplete: (usage) => {
                if (signal.aborted) return;

                // Calculate cost if pricing available
                let estimatedCost: number | undefined;
                if (usage && provider.fetchedModels) {
                  const model = provider.fetchedModels.find((m) => m.id === agent.modelId);
                  if (model && model.pricing) {
                    const promptCost =
                      (usage.promptTokens / 1_000_000) * parseFloat(model.pricing.prompt);
                    const completionCost =
                      (usage.completionTokens / 1_000_000) * parseFloat(model.pricing.completion);
                    estimatedCost = promptCost + completionCost;
                    if (usage) {
                      usage.estimatedCost = estimatedCost;
                    }
                  }
                }

                // Update global stats if usage is available
                if (usage) {
                  updateGlobalTokenStats(agent.modelId, usage);
                  // Update session-level token usage (accumulated)
                  updateSessionTokenUsage(activeSessionId, {
                    totalTokens: usage.totalTokens,
                    totalCost: usage.estimatedCost || 0,
                  });
                }

                // Update message with token usage and calculate metrics
                const streamEndTime = Date.now();
                setMessages((prev) => {
                  const final = prev.map((m) => {
                    if (m.id === messageId) {
                      const updatedMsg = {
                        ...m,
                        isStreaming: false,
                        tokenUsage: usage,
                        streamEndTime,
                      };
                      // Calculate metrics
                      const metrics = calculateMessageMetrics(updatedMsg);
                      return {
                        ...updatedMsg,
                        rating: {
                          ...m.rating,
                          metrics,
                        },
                      };
                    }
                    return m;
                  });
                  saveMessagesToStorage(activeSessionId, final);
                  return final;
                });
                abortControllersRef.current.delete(messageId);
              },
            });
          } catch (error: unknown) {
            if (error instanceof Error && error.name === 'AbortError') return;

            let errorMessage = 'Unknown error';
            let isFreeTrierLimitError = false;

            if (error instanceof Error) {
              // Check for free tier limit error
              if (error.message.startsWith('FREE_TIER_LIMIT:') || error.message.startsWith('NO_FREE_TIER:')) {
                isFreeTrierLimitError = true;
                showToast(
                  `${t('app.freeTier.limitReached')}: ${t('app.freeTier.limitReachedDesc')}`
                );
              } else {
                errorMessage = error.message;
              }
            }

            setMessages((prev) => {
              const final = prev.map((m) => {
                if (m.id === messageId) {
                  // For free tier limit errors, don't show error in message bubble
                  // Just end the streaming gracefully
                  if (isFreeTrierLimitError) {
                    return { ...m, isStreaming: false };
                  }
                  return { ...m, isStreaming: false, error: errorMessage };
                }
                return m;
              });
              saveMessagesToStorage(activeSessionId, final);
              return final;
            });
            abortControllersRef.current.delete(messageId);
          }
        })
      );
    } finally {
      // Use setTimeout to ensure all onComplete/error handlers have executed
      setTimeout(() => {
        if (abortControllersRef.current.size === 0) {
          setIsStreaming(false);
        }
      }, 100);
    }
  };

  // Regenerate response for a single specific agent
  const regenerateSingleAgent = async (userPrompt: string, targetAgentId: string) => {
    if (!userPrompt.trim() || !activeSessionId) return;

    const currentInput = userPrompt.trim();

    // Find the target agent
    const targetAgent = agents.find((a) => a.id === targetAgentId);
    if (!targetAgent) {
      console.error('Target agent not found:', targetAgentId);
      return;
    }

    // Create placeholder message for this single agent
    const agentMessage: Message = {
      id: generateId(),
      sessionId: activeSessionId,
      role: 'model',
      content: '',
      agentId: targetAgent.id,
      timestamp: Date.now(),
      isStreaming: true,
      streamStartTime: Date.now(),
    };

    // Add the placeholder message
    setMessages((prev) => {
      const newMessagesState = [...prev, agentMessage];
      saveMessagesToStorage(activeSessionId, newMessagesState);
      return newMessagesState;
    });
    setIsStreaming(true);

    setTimeout(onScrollToBottom, 100);

    // Generate for this single agent
    try {
      const messageId = agentMessage.id;
      const provider = providers.find((p) => p.id === targetAgent.providerId);

      // Create individual AbortController for this agent
      const controller = new AbortController();
      abortControllersRef.current.set(messageId, controller);
      const signal = controller.signal;

      if (!provider) {
        setMessages((prev) => {
          const final = prev.map((m) =>
            m.id === messageId ? { ...m, isStreaming: false, error: t('app.configError') } : m
          );
          saveMessagesToStorage(activeSessionId, final);
          return final;
        });
        abortControllersRef.current.delete(messageId);
        if (abortControllersRef.current.size === 0) {
          setIsStreaming(false);
        }
        return;
      }

      try {
        await generateContentStream({
          agent: targetAgent,
          provider: provider,
          prompt: currentInput,
          signal: signal,
          onChunk: (text) => {
            if (signal.aborted) return;
            setMessages((prev) =>
              prev.map((m) => (m.id === messageId ? { ...m, content: m.content + text } : m))
            );
          },
          onComplete: (usage) => {
            if (signal.aborted) return;

            // Calculate cost if pricing available
            let estimatedCost: number | undefined;
            if (usage && provider.fetchedModels) {
              const model = provider.fetchedModels.find((m) => m.id === targetAgent.modelId);
              if (model && model.pricing) {
                const promptCost =
                  (usage.promptTokens / 1_000_000) * parseFloat(model.pricing.prompt);
                const completionCost =
                  (usage.completionTokens / 1_000_000) * parseFloat(model.pricing.completion);
                estimatedCost = promptCost + completionCost;
                if (usage) {
                  usage.estimatedCost = estimatedCost;
                }
              }
            }

            // Update global stats if usage is available
            if (usage) {
              updateGlobalTokenStats(targetAgent.modelId, usage);
              // Update session-level token usage (accumulated)
              updateSessionTokenUsage(activeSessionId, {
                totalTokens: usage.totalTokens,
                totalCost: usage.estimatedCost || 0,
              });
            }

            // Update message with token usage
            setMessages((prev) => {
              const final = prev.map((m) =>
                m.id === messageId ? { ...m, isStreaming: false, tokenUsage: usage } : m
              );
              saveMessagesToStorage(activeSessionId, final);
              return final;
            });
            abortControllersRef.current.delete(messageId);
            if (abortControllersRef.current.size === 0) {
              setIsStreaming(false);
            }
          },
        });
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') return;

        let errorMessage = 'Unknown error';
        let isFreeTrierLimitError = false;

        if (error instanceof Error) {
          // Check for free tier limit error
          if (error.message.startsWith('FREE_TIER_LIMIT:') || error.message.startsWith('NO_FREE_TIER:')) {
            isFreeTrierLimitError = true;
            showToast(
              `${t('app.freeTier.limitReached')}: ${t('app.freeTier.limitReachedDesc')}`
            );
          } else {
            errorMessage = error.message;
          }
        }

        setMessages((prev) => {
          const final = prev.map((m) => {
            if (m.id === messageId) {
              // For free tier limit errors, don't show error in message bubble
              // Just end the streaming gracefully
              if (isFreeTrierLimitError) {
                return { ...m, isStreaming: false };
              }
              return { ...m, isStreaming: false, error: errorMessage };
            }
            return m;
          });
          saveMessagesToStorage(activeSessionId, final);
          return final;
        });
        abortControllersRef.current.delete(messageId);
        if (abortControllersRef.current.size === 0) {
          setIsStreaming(false);
        }
      }
    } catch (error: unknown) {
      console.error('Error regenerating single agent:', error);
      if (error instanceof Error && error.message.startsWith('FREE_TIER_LIMIT:')) {
        showToast(
          `${t('app.freeTier.limitReached')}: ${t('app.freeTier.limitReachedDesc')}`
        );
      }
      if (abortControllersRef.current.size === 0) {
        setIsStreaming(false);
      }
    }
  };

  return {
    isStreaming,
    sendMessage,
    regenerateResponses,
    regenerateSingleAgent, // Export single agent regeneration
    stopGeneration,
    stopAgent, // Export individual agent stop function
  };
};
