
import React, { useMemo } from 'react';
import { Session } from '../types';
import { MessageSquarePlus, MessageSquare, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getTimeGroup, TimeGroup } from '../utils/common';

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  isOpen,
  toggleSidebar
}) => {
  const { t } = useTranslation();

  // Group sessions by time
  const groupedSessions = useMemo(() => {
    const groups: Record<TimeGroup, Session[]> = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: []
    };

    sessions.forEach(session => {
      const group = getTimeGroup(session.updatedAt);
      groups[group].push(session);
    });

    return groups;
  }, [sessions]);

  const timeGroups: TimeGroup[] = ['today', 'yesterday', 'thisWeek', 'older'];

  const renderSessionItem = (session: Session) => (
    <div
      key={session.id}
      onClick={() => onSelectSession(session.id)}
      className={`
        group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors
        ${activeSessionId === session.id
          ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'}
      `}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <MessageSquare size={16} className="flex-shrink-0 opacity-70" />
        <span className="truncate text-sm font-medium">
          {session.title}
        </span>
      </div>

      <button
        onClick={(e) => onDeleteSession(session.id, e)}
        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
        title={t('sidebar.deleteSession')}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleSidebar}
      />

      {/* Sidebar Container */}
      <div className={`
        fixed md:relative z-30 flex flex-col h-full w-72 
        bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight flex items-center gap-2">
            <span className="bg-blue-600 text-white p-1 rounded text-xs">N</span>
            {t('app.title')}
          </h1>
          <button 
            onClick={onCreateSession}
            className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-sm"
            aria-label={t('sidebar.newChat')}
            title={t('sidebar.newChat')}
          >
            <MessageSquarePlus size={20} />
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto p-2">
          {sessions.length === 0 ? (
            <div className="text-gray-400 dark:text-gray-500 text-sm text-center mt-10 whitespace-pre-line">
              {t('sidebar.noSessions')}
            </div>
          ) : (
            <div className="space-y-4">
              {timeGroups.map(group => {
                const groupSessions = groupedSessions[group];
                if (groupSessions.length === 0) return null;

                return (
                  <div key={group} className="space-y-1">
                    {/* Group Header */}
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {t(`sidebar.${group}`)}
                    </div>
                    {/* Group Sessions */}
                    {groupSessions.map(renderSessionItem)}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-500 text-center bg-gray-50 dark:bg-gray-900/50">
          {t('sidebar.footer', { version: '1.2' })}
        </div>
      </div>
    </>
  );
};
