import { state } from "@/core/state.js";
import BASE_COOKIES from "@/cookies" with { type: "json" };
import { getDelay, sleep } from "@/lib/time.js";

// Interfaz alineada con los tipos nativos de Playwright/Puppeteer
export interface CookieInput {
  nombre: string;
  valor: string;
}

/**
 * Navega a una URL configurando cookies específicas de forma segura.
 */
export async function navigate(
  url: string,
  retries: number = 3,
  cookies: CookieInput[] = BASE_COOKIES as CookieInput[],
): Promise<boolean> {
  const manager = state.browser;

  const { context, page } = manager.getManager();
  for (let i = 1; i <= retries; i++) {
    try {
      // Ejecuta la limpieza y asignación de cookies en paralelo
      await context.clearCookies();

      if (cookies.length) {
        await context.addCookies(
          cookies.map(({ nombre, valor }) => ({
            name: nombre,
            value: valor,
            url: new URL(manager.baseURL).toString(),
          })),
        );
      }

      // Espera a que la página cargue por completo (domcontentloaded o networkidle)
      await page.goto(url, {
        timeout: 15000,
        waitUntil: "domcontentloaded",
      });

      return true;
    } catch {
      console.log(`Intento ${i}/${retries} falló.`);

      await sleep(getDelay(retries));
    }
  }

  return false;
}
