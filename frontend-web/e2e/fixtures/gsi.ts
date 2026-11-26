import type { Page } from "@playwright/test";

/**
 * Stub del script de Google Identity Services.
 *
 * El backend solo acepta `POST /auth/google` con un ID token real de Google, y
 * Google bloquea el consentimiento automatizado. Las pruebas E2E siembran la
 * sesión en `localStorage`, así que aquí solo necesitamos que el botón de login
 * exista, sea accesible y tenga el texto correcto para axe y para las pruebas de
 * teclado. La verificación visual de la marca de Google (escenario 15) sigue
 * siendo manual: este botón no es el oficial.
 */
export const GSI_SCRIPT = `
(function () {
  var g = (window.google = window.google || {});
  g.accounts = g.accounts || {};
  g.accounts.id = {
    initialize: function (config) { window.__e2eGsiConfig = config; },
    renderButton: function (parent, options) {
      parent.innerHTML = "";
      var isEnglish = (document.documentElement.lang || "es").toLowerCase().indexOf("en") === 0;
      var text = isEnglish ? "Continue with Google" : "Continuar con Google";
      var button = document.createElement("button");
      button.type = "button";
      // Sin aria-label: el nombre accesible sale del texto visible. Un
      // aria-label que no incluya el texto visible dispara
      // label-content-name-mismatch en axe.
      button.textContent = text;
      button.style.cssText =
        "display:inline-flex;align-items:center;gap:12px;min-height:44px;padding:0 24px;" +
        "border-radius:9999px;border:1px solid #747775;background:#ffffff;color:#1f1f1f;" +
        "font:inherit;cursor:pointer;";
      button.addEventListener("click", function () {
        var config = window.__e2eGsiConfig;
        if (config && typeof config.callback === "function") {
          config.callback({ credential: "e2e-stub-credential" });
        }
      });
      parent.appendChild(button);
      window.__e2eGsiButton = button;
    },
    disableAutoSelect: function () {},
    prompt: function () {},
    cancel: function () {}
  };
})();
`;

export async function installGsiStub(page: Page): Promise<void> {
  await page.route(/accounts\.google\.com\/gsi\/client/, (route) =>
    route.fulfill({ status: 200, contentType: "application/javascript", body: GSI_SCRIPT }),
  );
}

export async function waitForGsiButton(page: Page): Promise<void> {
  await page.locator("button", { hasText: /Continuar con Google|Continue with Google/ }).first().waitFor();
}
