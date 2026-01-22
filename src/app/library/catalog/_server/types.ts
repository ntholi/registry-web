import type { getCatalogBooks, getCatalogPublications } from './actions';

export type CatalogBook = Awaited<ReturnType<typeof getCatalogBooks>>[number];
export type CatalogPublication = Awaited<
	ReturnType<typeof getCatalogPublications>
>[number];
