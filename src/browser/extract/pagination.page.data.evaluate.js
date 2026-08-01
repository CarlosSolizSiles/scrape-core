/**
 * Extracts the current pagination page data.
 *
 * Returns the posts found on the current page together with the
 * highest page number available in the pagination controls.
 *
 * @returns {import("./paginationPageData.js").PaginationPageData | null}
 */
export function EvaluatePaginationPageData() {
  const container = document.querySelector(".td-ss-main-content");
  const pageNav = document.querySelector(".page-nav");

  if (!container || !pageNav) return null;

  let totalPages = null;

  for (const el of pageNav.querySelectorAll("a, span")) {
    const value = Number(el.textContent?.trim());

    if (Number.isFinite(value) && (totalPages === null || value > totalPages)) {
      totalPages = value;
    }
  }

  if (totalPages === null) return null;

  /**
   * Extracts posts from a section.
   *
   * @param {Element} container
   * @param {string} selector
   * @returns {import("./paginationPageData.js").Post[]}
   */
  const extractPosts = (container, selector) =>
    [...container.querySelectorAll(selector)].flatMap((el) => {
      const href =
        /** @type {HTMLAnchorElement|null} */
        (el.querySelector("a[rel='bookmark']"))?.href;

      const updated = el.querySelector("time")?.getAttribute("datetime");

      if (!href || !updated) return [];

      const updatedAt = Date.parse(updated);
      const match = href.match(/\/([^/]+)\/?$/);

      if (!match || !updatedAt) return [];

      const [, id] = match;

      if (!id) return [];

      return [{ id, updatedAt }];
    });

  if (location.pathname === "/" || location.pathname === "/page/1/") {
    const modules = container.querySelectorAll(".td-block-row .td_module_1");

    modules[0]?.setAttribute("no-select", "");
    modules[1]?.setAttribute("no-select", "");
  }

  return {
    posts: extractPosts(container, ".td_module_1:not([no-select])"),
    totalPages,
  };
}
