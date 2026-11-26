import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

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
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : fallbackStorage,
      ),
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
