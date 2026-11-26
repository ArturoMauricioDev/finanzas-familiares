import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

import * as storage from "../storage";

export type FamilyCreatorRole = "padre" | "madre";

export type FamilyWizardStep = 1 | 2 | 3;

export interface FamilyDraftState {
  step: FamilyWizardStep;
  nombre: string;
  moneda: string;
  rolFamiliar: FamilyCreatorRole;
  hydrated: boolean;
  setNombre: (value: string) => void;
  setMoneda: (value: string) => void;
  setRole: (value: FamilyCreatorRole) => void;
  goTo: (step: FamilyWizardStep) => void;
  next: () => void;
  back: () => void;
  reset: () => void;
  markHydrated: () => void;
}

const initialFields = {
  step: 1 as FamilyWizardStep,
  nombre: "",
  moneda: "",
  rolFamiliar: "padre" as FamilyCreatorRole,
};

const asyncStorage: StateStorage = {
  getItem: (name) => storage.getItemAsync(name),
  setItem: (name, value) => storage.setItemAsync(name, value),
  removeItem: (name) => storage.deleteItemAsync(name),
};

export const useFamilyDraft = create<FamilyDraftState>()(
  persist(
    (set) => ({
      ...initialFields,
      hydrated: false,
      setNombre: (nombre) => set({ nombre }),
      setMoneda: (moneda) => set({ moneda }),
      setRole: (rolFamiliar) => set({ rolFamiliar }),
      goTo: (step) => set({ step }),
      next: () =>
        set((state) => ({
          step: (state.step < 3 ? state.step + 1 : state.step) as FamilyWizardStep,
        })),
      back: () =>
        set((state) => ({
          step: (state.step > 1 ? state.step - 1 : state.step) as FamilyWizardStep,
        })),
      reset: () => set({ ...initialFields }),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "kitho_family_draft",
      storage: createJSONStorage(() => asyncStorage),
      skipHydration: true,
      partialize: (state) => ({
        step: state.step,
        nombre: state.nombre,
        moneda: state.moneda,
        rolFamiliar: state.rolFamiliar,
      }),
    },
  ),
);

export function rehydrateFamilyDraft(): Promise<void> {
  return Promise.resolve(useFamilyDraft.persist.rehydrate()).then(() => {
    useFamilyDraft.getState().markHydrated();
  });
}
