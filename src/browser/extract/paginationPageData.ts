import { state } from "@/core/state.js";
import { EvaluatePaginationPageData } from "./pagination.page.data.evaluate.js";

export interface Post {
  id: string;
  updatedAt: number;
}

export interface PaginationPageData {
  posts: Post[];
  totalPages: number;
}

export const extractPaginationPageData =
  async (): Promise<PaginationPageData | null> => {
    const page = state.browser.getPage("scraping");

    return page.evaluate(EvaluatePaginationPageData);
  };
