import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

import * as storage from "../storage";
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

const asyncStorage: StateStorage = {
  getItem: (name) => storage.getItemAsync(name),
  setItem: (name, value) => storage.setItemAsync(name, value),
  removeItem: (name) => storage.deleteItemAsync(name),
};

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
      storage: createJSONStorage(() => asyncStorage),
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
