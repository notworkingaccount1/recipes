export type Status = 'cooked' | 'planned';
export type Amount = number | string | null | undefined;
export type Ratings = Record<string, number>;

export interface Rater { id: string; name: string }

/** Recipe as it is stored in data.json */
export interface RawRecipe {
  id: string;
  title: string;
  status: Status;
  category: string;
  ratings?: Ratings;
  ingredients?: Record<string, Amount>;
  notes?: string;
}
export interface RawData {
  title?: string;
  raters?: Rater[];
  categories?: string[];
  recipes?: RawRecipe[];
}

export interface Ingredient { name: string; unit: string; amount: Amount }
export interface Recipe {
  id: string;
  title: string;
  status: Status;
  category: string;
  ratings: Ratings;
  notes: string;
  ingredients: Ingredient[];
}
export interface Data { title: string; raters: Rater[]; categories: string[]; recipes: Recipe[] }

export interface Changes {
  upserts: Record<string, RawRecipe>;
  deleted: string[];
  cats: string[];
  pub?: string;
}

export interface Gh { repo: string; branch: string; dataBranch: string; dir: string; token: string }

export interface AggItem { k: string; pk: string; name: string; unit: string; fam?: string; sum: number; hasNum: boolean }

export type SharedKind = 'p' | 's' | 'c';
export interface SharedSets { pantry: Set<string>; shop: Set<string>; checked: Set<string> }
