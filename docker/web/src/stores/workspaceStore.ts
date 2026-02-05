import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/shallow';
import type {
  EditorType,
  AgentStatus,
  TaskPanelHeight,
  Message,
  Task,
  TimelineEvent,
  UIDirective,
  Skill,
  Artifact,
} from '@/types/workspace';

// ============================================================
// State Interface
// ============================================================

interface WorkspaceState {
  // === Configuration ===
  apiKey: string | null;
  provider: 'anthropic' | 'openai' | 'google';
  model: string;
  configured: boolean;

  // === Agent Status ===
  agentStatus: AgentStatus;
  agentError: string | null;

  // === Layout ===
  chatPanelWidth: number;
  taskPanelHeight: TaskPanelHeight;
  chatExpanded: boolean;

  // === Chat ===
  messages: Message[];
  isStreaming: boolean;
  currentStreamId: string | null;
  sessionId: string | null;

  // === Tasks ===
  tasks: Task[];
  activeTaskId: string | null;

  // === Editor ===
  activeEditor: EditorType;
  editorStates: Record<EditorType, unknown>;

  // === Timeline ===
  timeline: TimelineEvent[];
  timelinePosition: number;

  // === Skills ===
  skills: Skill[];
  skillsLoading: boolean;

  // === Artifacts ===
  artifacts: Artifact[];
  artifactsLoading: boolean;
  selectedArtifact: string | null;
}

// ============================================================
// Actions Interface
// ============================================================

interface WorkspaceActions {
  // === Config ===
  setConfig: (config: { apiKey: string; provider: string; model: string }) => void;
  clearConfig: () => void;

  // === Agent ===
  setAgentStatus: (status: AgentStatus) => void;
  setAgentError: (error: string | null) => void;

  // === Layout ===
  setChatPanelWidth: (width: number) => void;
  setTaskPanelHeight: (height: TaskPanelHeight) => void;
  toggleChat: () => void;

  // === Chat ===
  setSessionId: (id: string | null) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  appendStreamChunk: (id: string, chunk: string) => void;
  clearMessages: () => void;
  setStreaming: (streaming: boolean, streamId?: string) => void;

  // === Task ===
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  setActiveTaskId: (id: string | null) => void;

  // === Editor ===
  setActiveEditor: (editor: EditorType) => void;
  updateEditorState: (editor: EditorType, state: unknown) => void;

  // === Timeline ===
  addTimelineEvent: (event: TimelineEvent) => void;
  seekTimeline: (position: number) => void;

  // === UI Directives ===
  executeDirective: (directive: UIDirective) => void;

  // === Skills ===
  setSkills: (skills: Skill[]) => void;
  setSkillsLoading: (loading: boolean) => void;

  // === Artifacts ===
  setArtifacts: (artifacts: Artifact[]) => void;
  addArtifact: (artifact: Artifact) => void;
  removeArtifact: (path: string) => void;
  setArtifactsLoading: (loading: boolean) => void;
  setSelectedArtifact: (path: string | null) => void;
}

// ============================================================
// Store Implementation
// ============================================================

export const useWorkspaceStore = create<WorkspaceState & WorkspaceActions>()(
  persist(
    (set, get) => ({
      // Initial State
      apiKey: null,
      provider: 'google',
      model: 'gemini-2.5-flash',
      configured: false,

      agentStatus: 'idle',
      agentError: null,

      chatPanelWidth: 380,
      taskPanelHeight: 'collapsed',
      chatExpanded: true,

      messages: [],
      isStreaming: false,
      currentStreamId: null,
      sessionId: null,

      tasks: [],
      activeTaskId: null,

      activeEditor: 'ai-editor',
      editorStates: {} as Record<EditorType, unknown>,

      timeline: [],
      timelinePosition: 0,

      skills: [],
      skillsLoading: false,

      artifacts: [],
      artifactsLoading: false,
      selectedArtifact: null,

      // Actions
      setConfig: (config) =>
        set({
          apiKey: config.apiKey,
          provider: config.provider as 'anthropic' | 'openai' | 'google',
          model: config.model,
          configured: true,
        }),

      clearConfig: () =>
        set({
          apiKey: null,
          configured: false,
        }),

      setAgentStatus: (status) => set({ agentStatus: status }),
      setAgentError: (error) => set({ agentError: error }),

      setChatPanelWidth: (width) =>
        set({
          chatPanelWidth: Math.max(280, Math.min(600, width)),
        }),

      setTaskPanelHeight: (height) => set({ taskPanelHeight: height }),

      toggleChat: () =>
        set((state) => ({
          chatExpanded: !state.chatExpanded,
        })),

      setSessionId: (id) => set({ sessionId: id }),

      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),

      updateMessage: (id, updates) =>
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === id ? { ...msg, ...updates } : msg
          ),
        })),

      appendStreamChunk: (id, chunk) =>
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === id ? { ...msg, content: msg.content + chunk } : msg
          ),
        })),

      clearMessages: () => set({ messages: [] }),

      setStreaming: (streaming, streamId) =>
        set({
          isStreaming: streaming,
          currentStreamId: streamId || null,
        }),

      setTasks: (tasks) => set({ tasks }),

      addTask: (task) =>
        set((state) => ({
          tasks: [...state.tasks, task],
        })),

      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...updates } : task
          ),
        })),

      setActiveTaskId: (id) => set({ activeTaskId: id }),

      setActiveEditor: (editor) => set({ activeEditor: editor }),

      updateEditorState: (editor, state) =>
        set((prev) => ({
          editorStates: { ...prev.editorStates, [editor]: state },
        })),

      addTimelineEvent: (event) =>
        set((state) => ({
          timeline: [...state.timeline, event],
        })),

      seekTimeline: (position) => set({ timelinePosition: position }),

      executeDirective: (directive) => {
        const { type, payload } = directive;
        switch (type) {
          case 'switch_editor':
            set({ activeEditor: payload.editor });
            break;
          case 'open_task_panel':
            set({ taskPanelHeight: payload.height });
            break;
          case 'show_notification':
            // Toast notifications handled separately
            console.log('Notification:', payload);
            break;
        }
      },

      // Skills actions
      setSkills: (skills) => set({ skills }),
      setSkillsLoading: (loading) => set({ skillsLoading: loading }),

      // Artifacts actions
      setArtifacts: (artifacts) => set({ artifacts }),
      addArtifact: (artifact) =>
        set((state) => ({
          artifacts: [artifact, ...state.artifacts.filter((a) => a.path !== artifact.path)],
        })),
      removeArtifact: (path) =>
        set((state) => ({
          artifacts: state.artifacts.filter((a) => a.path !== path),
          selectedArtifact: state.selectedArtifact === path ? null : state.selectedArtifact,
        })),
      setArtifactsLoading: (loading) => set({ artifactsLoading: loading }),
      setSelectedArtifact: (path) => set({ selectedArtifact: path }),
    }),
    {
      name: 'openprismer-workspace',
      partialize: (state) => ({
        apiKey: state.apiKey,
        provider: state.provider,
        model: state.model,
        configured: state.configured,
        chatPanelWidth: state.chatPanelWidth,
        messages: state.messages.slice(-100),
        sessionId: state.sessionId,
      }),
    }
  )
);

// ============================================================
// Selector Hooks (using useShallow to prevent infinite loops)
// ============================================================

export const useConfig = () =>
  useWorkspaceStore(
    useShallow((s) => ({
      apiKey: s.apiKey,
      provider: s.provider,
      model: s.model,
      configured: s.configured,
      setConfig: s.setConfig,
      clearConfig: s.clearConfig,
    }))
  );

export const useAgentStatus = () =>
  useWorkspaceStore(
    useShallow((s) => ({
      status: s.agentStatus,
      error: s.agentError,
      setStatus: s.setAgentStatus,
      setError: s.setAgentError,
    }))
  );

export const useMessages = () =>
  useWorkspaceStore(
    useShallow((s) => ({
      messages: s.messages,
      isStreaming: s.isStreaming,
      sessionId: s.sessionId,
      addMessage: s.addMessage,
      updateMessage: s.updateMessage,
      appendStreamChunk: s.appendStreamChunk,
      clearMessages: s.clearMessages,
      setStreaming: s.setStreaming,
      setSessionId: s.setSessionId,
    }))
  );

export const useTasks = () =>
  useWorkspaceStore(
    useShallow((s) => ({
      tasks: s.tasks,
      activeTaskId: s.activeTaskId,
      setTasks: s.setTasks,
      addTask: s.addTask,
      updateTask: s.updateTask,
      setActiveTaskId: s.setActiveTaskId,
    }))
  );

export const useActiveEditor = () => {
  const activeEditor = useWorkspaceStore((s) => s.activeEditor);
  const setActiveEditor = useWorkspaceStore((s) => s.setActiveEditor);
  const editorStates = useWorkspaceStore((s) => s.editorStates);
  const updateEditorState = useWorkspaceStore((s) => s.updateEditorState);

  return {
    activeEditor,
    setActiveEditor,
    editorState: editorStates[activeEditor],
    updateEditorState: (state: unknown) => updateEditorState(activeEditor, state),
  };
};

export const useLayout = () =>
  useWorkspaceStore(
    useShallow((s) => ({
      chatPanelWidth: s.chatPanelWidth,
      taskPanelHeight: s.taskPanelHeight,
      chatExpanded: s.chatExpanded,
      setChatPanelWidth: s.setChatPanelWidth,
      setTaskPanelHeight: s.setTaskPanelHeight,
      toggleChat: s.toggleChat,
    }))
  );

export const useSkills = () =>
  useWorkspaceStore(
    useShallow((s) => ({
      skills: s.skills,
      loading: s.skillsLoading,
      setSkills: s.setSkills,
      setLoading: s.setSkillsLoading,
    }))
  );

export const useArtifacts = () =>
  useWorkspaceStore(
    useShallow((s) => ({
      artifacts: s.artifacts,
      loading: s.artifactsLoading,
      selectedArtifact: s.selectedArtifact,
      setArtifacts: s.setArtifacts,
      addArtifact: s.addArtifact,
      removeArtifact: s.removeArtifact,
      setLoading: s.setArtifactsLoading,
      setSelected: s.setSelectedArtifact,
    }))
  );
