import fullDataset from "./tus_books.json";

export interface TUSBookSection {
  id: string;
  name: string;
  order: number;
}

export interface TUSBook {
  id: string;
  slug: string;
  name: string;
  category: "temel" | "klinik";
  imageUrl: string;
  productUrl: string;
  price: string | null;
  sections: TUSBookSection[];
}

export interface TUSBooksDataset {
  scrapedAt: string;
  source: string;
  books: TUSBook[];
}

const dataset = fullDataset as TUSBooksDataset;

export const TUS_BOOKS: TUSBook[] = dataset.books;

export function getBookById(id: string): TUSBook | undefined {
  return TUS_BOOKS.find((b) => b.id === id);
}

export function formatBookName(name: string): string {
  return name.replace(/&/g, " & ");
}
