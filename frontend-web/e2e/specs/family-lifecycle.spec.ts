import { expect, test } from "../fixtures/test";
import {
  createFamilyViaApi,
  createInvitationViaApi,
  fetchFamilyViaApi,
  joinWithCodeViaApi,
} from "../fixtures/api";
import { actor } from "../fixtures/seed";

/** 002 · Escenario 18. Eliminar solo con 1 integrante; con 2+ solo abandonar. */
test.describe("Ciclo de vida de la familia", () => {
  test("con un solo integrante se ofrece Eliminar familia, no Abandonar", async ({ openAs }) => {
    const page = await openAs("solo", { path: "/family/members" });
    await expect(page.getByRole("heading", { level: 1, name: "Familia Solo" })).toBeVisible();

    const deleteButton = page.getByRole("button", { name: "Eliminar familia" });
    await expect(deleteButton).toBeVisible();
    await expect(page.getByRole("button", { name: "Abandonar familia" })).toHaveCount(0);

    await deleteButton.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Se eliminará «Familia Solo»");

    await dialog.getByRole("button", { name: "Cancelar" }).first().click();
    await expect(dialog).toBeHidden();
    await expect(deleteButton).toBeVisible();
  });

  test("con dos o más integrantes solo se puede abandonar, también como admin", async ({
    openAs,
  }) => {
    const page = await openAs("admin", { path: "/family/members" });
    await expect(page.getByRole("heading", { level: 1, name: "Familia E2E" })).toBeVisible();

    const leaveButton = page.getByRole("button", { name: "Abandonar familia" });
    await expect(leaveButton).toBeVisible();
    await expect(page.getByRole("button", { name: "Eliminar familia" })).toHaveCount(0);

    await leaveButton.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("Dejarás de formar parte de «Familia E2E»");
    await dialog.getByRole("button", { name: "Cancelar" }).first().click();
    await expect(dialog).toBeHidden();
  });

  test("eliminar una familia de un integrante redirige al ciclo y libera al usuario", async ({
    openAs,
    request,
  }) => {
    const { session } = await createFamilyViaApi(request, actor(8), {
      nombre: "Familia Borrar",
    });
    const page = await openAs(session, { path: "/family/members" });
    await expect(page.getByRole("heading", { level: 1, name: "Familia Borrar" })).toBeVisible();

    await page.getByRole("button", { name: "Eliminar familia" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Eliminar familia" }).click();

    await expect(page).toHaveURL(/\/family\/select$/, { timeout: 20_000 });
    const { status } = await fetchFamilyViaApi(request, session);
    expect(status).toBe(403);
  });

  test("al abandonar, el administrador restante se reasigna automáticamente", async ({
    openAs,
    request,
  }) => {
    const admin = await createFamilyViaApi(request, actor(9), { nombre: "Familia Relevo" });
    const invitation = await createInvitationViaApi(request, admin.session, {
      rol_familiar: "hijo",
    });
    const joiner = await joinWithCodeViaApi(request, actor(10), invitation.codigo);

    const page = await openAs(admin.session, { path: "/family/members" });
    await expect(page.getByRole("heading", { level: 1, name: "Familia Relevo" })).toBeVisible();

    await page.getByRole("button", { name: "Abandonar familia" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Abandonar familia" }).click();

    await expect(page).toHaveURL(/\/family\/select$/, { timeout: 20_000 });

    const { status, body } = await fetchFamilyViaApi(request, joiner);
    expect(status).toBe(200);
    const me = body?.members.find((member) => member.user_id === joiner.user.id);
    expect(me?.role ?? me?.rol_permiso).toBe("admin");
  });
});
