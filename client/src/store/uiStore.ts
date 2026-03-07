import { create } from 'zustand';

interface UiState {
  nlqPanelOpen: boolean;
  sidebarOpen: boolean;
  newLiveboardModalOpen: boolean;

  openNlq: () => void;
  closeNlq: () => void;
  toggleNlq: () => void;
  toggleSidebar: () => void;
  openNewLiveboardModal: () => void;
  closeNewLiveboardModal: () => void;
}

export const useUiStore = create<UiState>()((set) => ({
  nlqPanelOpen: false,
  sidebarOpen: true,
  newLiveboardModalOpen: false,

  openNlq: () => set({ nlqPanelOpen: true }),
  closeNlq: () => set({ nlqPanelOpen: false }),
  toggleNlq: () => set((s) => ({ nlqPanelOpen: !s.nlqPanelOpen })),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  openNewLiveboardModal: () => set({ newLiveboardModalOpen: true }),
  closeNewLiveboardModal: () => set({ newLiveboardModalOpen: false }),
}));
