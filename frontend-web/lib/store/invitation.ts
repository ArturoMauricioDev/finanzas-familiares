import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Invitation } from "../types";

export interface LastInvitationState {
  familyId: string | null;
  invitation: Invitation | null;
  hydrated: boolean;
  setInvitation: (familyId: string, invitation: Invitation) => void;
  clear: () => void;
  markHydrated: () => void;
}

const initialFields = {
  familyId: null as string | null,
  invitation: null as Invitation | null,
};

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key) => (store.has(key) ? (store.get(key) ?? null) : null),
    key: (index) => Array.from(store.keys())[index] ?? null,
    removeItem: (key) => {
      store.delete(key);
    },
    setItem: (key, value) => {
      store.set(key, value);
    },
  };
}

const fallbackStorage = createMemoryStorage();

export const useLastInvitation = create<LastInvitationState>()(
  persist(
    (set) => ({
      ...initialFields,
      hydrated: false,
      setInvitation: (familyId, invitation) => set({ familyId, invitation }),
      clear: () => set({ ...initialFields }),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "kitho_last_invitation",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : fallbackStorage,
      ),
      skipHydration: true,
      partialize: (state) => ({
        familyId: state.familyId,
        invitation: state.invitation,
      }),
    },
  ),
);

export function rehydrateLastInvitation(): Promise<void> {
  return Promise.resolve(useLastInvitation.persist.rehydrate()).then(() => {
    useLastInvitation.getState().markHydrated();
  });
}
