import React, { useState, useRef } from 'react';
import { Message, AgentConfig, LLMProvider } from '../types';
import { generateContentStream } from '../services/geminiService';
import { generateId, generateSmartTitle } from '../utils/common';
import { useTranslation } from 'react-i18next';

interface UseChatOrchestratorProps {
  activeSessionId: string | null;
  agents: AgentConfig[];
  providers: LLMProvider[];
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  saveMessagesToStorage: (sessionId: string, messages: Message[]) => void;
  onScrollToBottom: () => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
}

export const useChatOrchestrator = ({
  activeSessionId,
  agents,
  providers,
  messages,
  setMessages,
  saveMessagesToStorage,
  onScrollToBottom,
  updateSessionTitle
}: UseChatOrchestratorProps) => {
  const { t } = useTranslation();
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
      
      // Mark current streaming messages as done
      setMessages(prev => {
        const final = prev.map(m => m.isStreaming ? { ...m, isStreaming: false } : m);
        if (activeSessionId) saveMessagesToStorage(activeSessionId, final);
        return final;
      });
    }
  };

  const sendMessage = async (input: string) => {
    if (!input.trim() || !activeSessionId || isStreaming) return;

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
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length === 0) {
      // This is the first message, generate smart title
      const smartTitle = generateSmartTitle(currentInput);
      updateSessionTitle(activeSessionId, smartTitle);
    }

    // 2. Identify Active Agents
    const activeAgents = agents.filter(a => a.enabled);
    if (activeAgents.length === 0) {
        const errorMsg: Message = {
            id: generateId(),
            sessionId: activeSessionId,
            role: 'model',
            content: t('app.noAgentsEnabled'),
            timestamp: Date.now()
        };
        const updated = [...messages, userMsg, errorMsg];
        setMessages(updated);
        saveMessagesToStorage(activeSessionId, updated);
        setTimeout(onScrollToBottom, 100);
        return;
    }

    // 3. Create Placeholder Messages
    const agentMessages: Message[] = activeAgents.map(agent => ({
      id: generateId(),
      sessionId: activeSessionId,
      role: 'model',
      content: '',
      agentId: agent.id,
      timestamp: Date.now(),
      isStreaming: true,
    }));

    const newMessagesState = [...messages, userMsg, ...agentMessages];
    setMessages(newMessagesState);
    saveMessagesToStorage(activeSessionId, newMessagesState);
    setIsStreaming(true);
    
    setTimeout(onScrollToBottom, 100);

    // Setup Abort Controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // 4. Parallel Requests
    try {
      await Promise.all(activeAgents.map(async (agent, index) => {
        const messageId = agentMessages[index].id;
        const provider = providers.find(p => p.id === agent.providerId);

        if (!provider) {
             setMessages(prev => {
                 const final = prev.map(m => m.id === messageId ? { ...m, isStreaming: false, error: t('app.configError') } : m);
                 saveMessagesToStorage(activeSessionId, final);
                 return final;
             });
             return;
        }

        try {
          await generateContentStream({
            agent: agent,
            provider: provider,
            prompt: currentInput,
            signal: signal,
            onChunk: (text) => {
              if (signal.aborted) return;
              setMessages(prev => prev.map(m => 
                  m.id === messageId ? { ...m, content: m.content + text } : m
              ));
            }
          });

          if (!signal.aborted) {
            setMessages(prev => {
                const final = prev.map(m => m.id === messageId ? { ...m, isStreaming: false } : m);
                saveMessagesToStorage(activeSessionId, final);
                return final;
            });
          }

        } catch (err: unknown) {
          if (signal.aborted) return;

          console.error(err);
          const errorMessage = err instanceof Error ? err.message : t('common.failed');
          setMessages(prev => {
            const final = prev.map(m => m.id === messageId ? { ...m, isStreaming: false, error: errorMessage } : m);
            saveMessagesToStorage(activeSessionId, final);
            return final;
          });
        }
      }));
    } finally {
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    }
  };

  return {
    isStreaming,
    sendMessage,
    stopGeneration
  };
};