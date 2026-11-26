import { useFamilyDraft } from "../lib/store/familyDraft";

beforeEach(() => {
  useFamilyDraft.setState({
    step: 1,
    nombre: "",
    moneda: "",
    rolFamiliar: "padre",
    hydrated: false,
  });
});

describe("familyDraft store", () => {
  it("advances and goes back within the step bounds", () => {
    const { next, back } = useFamilyDraft.getState();
    next();
    next();
    next();
    expect(useFamilyDraft.getState().step).toBe(3);
    back();
    back();
    back();
    back();
    expect(useFamilyDraft.getState().step).toBe(1);
  });

  it("keeps fields until reset", () => {
    useFamilyDraft.getState().setNombre("Familia Pérez");
    useFamilyDraft.getState().setMoneda("EUR");
    useFamilyDraft.getState().setRole("madre");
    useFamilyDraft.getState().goTo(3);

    expect(useFamilyDraft.getState().nombre).toBe("Familia Pérez");
    expect(useFamilyDraft.getState().moneda).toBe("EUR");
    expect(useFamilyDraft.getState().rolFamiliar).toBe("madre");

    useFamilyDraft.getState().reset();
    const state = useFamilyDraft.getState();
    expect(state.step).toBe(1);
    expect(state.nombre).toBe("");
    expect(state.moneda).toBe("");
    expect(state.rolFamiliar).toBe("padre");
  });
});
