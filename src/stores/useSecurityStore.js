import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useSecurityStore = create(
  persist(
    (set) => ({
      pin: null, // default null means no passcode configured
      isLocked: false,

      setPin: (newPin) => set({ pin: newPin ? String(newPin) : null, isLocked: !!newPin }),
      
      lock: () => set((state) => ({ isLocked: state.pin ? true : false })),
      
      unlock: () => set({ isLocked: false }),
      
      clearPin: () => set({ pin: null, isLocked: false })
    }),
    {
      name: 'phoenix-security'
    }
  )
)
