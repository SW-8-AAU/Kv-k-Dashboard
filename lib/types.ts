/** Typed contract of the backend's /dashboard API. The dashboard is a thin
 *  client: every shape here mirrors a backend response verbatim. */

export type StoreType = "lidl" | "rema" | "salling";
export type Bucket = "match" | "possible" | "none";
export type MissingField = "image" | "quantity" | "unit";
export type CandidateSource = "products" | "off";

export interface LoginResponse {
  token: string;
  expiresIn: string;
}

export interface Candidate {
  ean: string;
  source: CandidateSource;
  score: number;
  reason: string;
  name: string | null;
  brand: string | null;
  quantity: number | null;
  unitText: string | null;
  imageUrl: string | null;
}

export interface LegacyProduct {
  ean: string;
  name: string;
}

export interface QueueItem {
  storeType: StoreType;
  storeProductId: string;
  name: string;
  brand: string | null;
  sizeText: string | null;
  quantity: number | null;
  unitText: string | null;
  imageUrl: string | null;
  price: number | null;
  oldPrice: number | null;
  url: string | null;
  bucket: Bucket;
  legacy: LegacyProduct | null;
  missing: MissingField[];
  candidates: Candidate[];
}

export interface QueueResponse {
  total: number;
  page: number;
  items: QueueItem[];
}

export interface QueueStatRow {
  storeType: StoreType;
  bucket: Bucket;
  count: number;
}

export interface LinkStatRow {
  storeType: StoreType;
  linkSource: string;
  count: number;
}

export interface StatsResponse {
  queue: QueueStatRow[];
  links: LinkStatRow[];
  pendingDuplicates: number;
  ignored: number;
}

export interface LinkedProduct {
  ean: string;
  name: string | null;
  brand: string | null;
  quantity: number | null;
  unitText: string | null;
  imageUrl: string | null;
}

export interface LinkListingItem {
  name: string;
  brand: string | null;
  imageUrl: string | null;
  // Raw Prisma row — Decimal serializes as a string ("12.95").
  price: number | string | null;
  sizeText: string | null;
}

export interface LinkItem {
  storeType: StoreType;
  storeProductId: string;
  linkSource: string;
  linkedAt: string;
  item: LinkListingItem | null;
  products: LinkedProduct[];
}

export interface LinksResponse {
  total: number;
  page: number;
  items: LinkItem[];
}

export interface LinkResult {
  status: "linked" | "renamed" | "merged";
  linkSource?: string;
  linked?: string[];
  created?: string[];
  ean?: string;
  /** Number of stores where the approval immediately wrote live offers. */
  priced?: number;
}

export interface UnlinkResult {
  status: string;
  removed: number;
}

export interface DuplicateSide {
  ean: string;
  name: string;
  brand: string | null;
  quantity: number | null;
  unitText: string | null;
  imageUrl: string | null;
  nameSource: string;
}

export interface DuplicatePair {
  id: string | number;
  reason: string;
  a: DuplicateSide;
  b: DuplicateSide;
}

export interface DuplicatesResponse {
  items: DuplicatePair[];
}

export interface StatusResult {
  status: string;
}
