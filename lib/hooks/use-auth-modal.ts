"use client"

import { create } from "zustand"

interface AuthModalState {
  isOpen: boolean
  reason?: string
  title?: string
  description?: string
  openModal: (reason?: string, title?: string, description?: string) => void
  closeModal: () => void
}

export const useAuthModal = create<AuthModalState>((set) => ({
  isOpen: false,
  reason: undefined,
  title: undefined,
  description: undefined,
  openModal: (reason, title, description) => set({ isOpen: true, reason, title, description }),
  closeModal: () => set({ isOpen: false, reason: undefined, title: undefined, description: undefined }),
}))
