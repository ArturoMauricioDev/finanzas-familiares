import { expect, test } from "../fixtures/test";
import {
  createFamilyViaApi,
  createInvitationViaApi,
  fetchFamilyViaApi,
} from "../fixtures/api";
import { actor, API_URL, loadSeed } from "../fixtures/seed";

const SESSION_KEY = "finanzas_familiares_session";

/** 002 · Escenario 16 y 003 · Escenarios 1, 2, 2b, 2c, 3 y 4. */
test.describe("Invitación y unión por código", () => {
  test("el rol por defecto es Hijo y el código se muestra con caducidad", async ({
    openAs,
    request,
  }) => {
    const { session } = await createFamilyViaApi(request, actor(0), {
      nombre: "Familia Invitación",
    });
    const page = await openAs(session, { path: "/family/members" });
    await expect(
      page.getByRole("heading", { level: 1, name: "Familia Invitación" }),
    ).toBeVisible();

    const roleSelect = page.getByLabel("Rol de la persona que invitas");
    await expect(roleSelect).toHaveValue("hijo");

    await page.getByRole("button", { name: "Generar invitación" }).click();

    await expect(page.getByText("Invitación para: Hijo")).toBeVisible();
    await expect(page.locator("#invite-code-expiry")).toContainText("Código de un solo uso");
    await expect(page.getByText(/Caduca el .+ · 7 días restantes/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Copiar código" })).toBeVisible();
  });

  test("el rol Otro exige vínculo y el campo desaparece al cambiarlo", async ({
    openAs,
    request,
  }) => {
    const { session } = await createFamilyViaApi(request, actor(1), {
      nombre: "Familia Vínculo",
    });
    const page = await openAs(session, { path: "/family/members" });
    const roleSelect = page.getByLabel("Rol de la persona que invitas");

    await roleSelect.selectOption("otro");
    const kinship = page.getByLabel("Vínculo familiar");
    await expect(kinship).toBeVisible();

    await page.getByRole("button", { name: "Generar invitación" }).click();
    await expect(page.getByText("Indica el vínculo familiar para continuar.")).toBeVisible();

    await kinship.fill("Cuñada");
    await page.getByRole("button", { name: "Generar invitación" }).click();
    await expect(page.getByText("Invitación para: Otro")).toBeVisible();

    await roleSelect.selectOption("hijo");
    await expect(kinship).toHaveCount(0);
  });

  test("unirse normaliza minúsculas y espacios y entra a la familia", async ({
    openAs,
    request,
  }) => {
    const admin = await createFamilyViaApi(request, actor(2), { nombre: "Familia Unión" });
    const invitation = await createInvitationViaApi(request, admin.session, {
      rol_familiar: "hijo",
    });

    const page = await openAs(actor(3), { path: "/invite" });
    await page.getByLabel("Código de invitación").fill(` ${invitation.codigo.toLowerCase()} `);
    await page.getByRole("button", { name: "Unirme a la familia" }).click();

    await expect(page).toHaveURL(/\/$/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { level: 1, name: "Inicio" })).toBeVisible();
    await expect(page.getByText("Familia Unión")).toBeVisible();

    const stored = await page.evaluate(
      (key) => JSON.parse(window.localStorage.getItem(key) ?? "null"),
      SESSION_KEY,
    );
    expect(stored.needs_family_setup).toBe(false);
    expect(stored.user.family_id).toBe(admin.family.id);
  });

  test("un código ya usado muestra el error traducido", async ({ openAs }) => {
    const page = await openAs(actor(4), { path: "/invite" });
    await page.getByLabel("Código de invitación").fill(loadSeed().invitations.used);
    await page.getByRole("button", { name: "Unirme a la familia" }).click();
    await expect(page.getByText("Este código de invitación ya fue utilizado.")).toBeVisible();
  });

  test("un código caducado muestra el error traducido", async ({ openAs }) => {
    const page = await openAs(actor(5), { path: "/invite" });
    await page.getByLabel("Código de invitación").fill(loadSeed().invitations.expired);
    await page.getByRole("button", { name: "Unirme a la familia" }).click();
    await expect(page.getByText("Este código de invitación ha caducado.")).toBeVisible();
  });

  test("un código heredado sin rol entra como miembro", async ({ openAs, request }) => {
    const page = await openAs(actor(6), { path: "/invite" });
    await page.getByLabel("Código de invitación").fill(loadSeed().invitations.legacy);
    await page.getByRole("button", { name: "Unirme a la familia" }).click();

    await expect(page).toHaveURL(/\/$/, { timeout: 20_000 });
    const stored = await page.evaluate(
      (key) => JSON.parse(window.localStorage.getItem(key) ?? "null"),
      SESSION_KEY,
    );
    const { body } = await fetchFamilyViaApi(request, stored);
    const me = body?.members.find((member) => member.user_id === stored.user.id);
    expect(me?.role).toBe("member");
    expect(me?.rol_familiar ?? null).toBeNull();
  });

  test("el backend rechaza un parentesco con un rol que no lo admite", async ({ request }) => {
    const { session } = await createFamilyViaApi(request, actor(7));
    const response = await request.post(`${API_URL}/api/v1/families/me/invitations`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      data: { rol_familiar: "hijo", parentesco: "Cuñada" },
    });
    expect(response.status()).toBe(422);
  });
});
