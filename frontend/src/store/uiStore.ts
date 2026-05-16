// frontend/src/store/uiStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIStore {
  sidebarOpen: boolean        // desktop collapsed/expanded
  mobileNavOpen: boolean      // mobile drawer open/closed
  deleteModalNoteId: string | null
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleMobileNav: () => void
  setMobileNavOpen: (open: boolean) => void
  openDeleteModal: (noteId: string) => void
  closeDeleteModal: () => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      mobileNavOpen: false,
      deleteModalNoteId: null,

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleMobileNav: () => set((s) => ({ mobileNavOpen: !s.mobileNavOpen })),
      setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
      openDeleteModal: (noteId) => set({ deleteModalNoteId: noteId }),
      closeDeleteModal: () => set({ deleteModalNoteId: null }),
    }),
    {
      name: 'ui-store',
      // Only persist desktop sidebar state — mobile drawer always starts closed
      partialize: (s) => ({ sidebarOpen: s.sidebarOpen }),
    }
  )
)