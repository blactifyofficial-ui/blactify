"use server";

import { getProducts } from "./data";

export async function fetchMoreProducts(offset: number, limit: number, category?: string, search?: string, sortBy?: string) {
    return getProducts({ offset, limit, category, search, sortBy });
}
