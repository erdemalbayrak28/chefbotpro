
export interface Ingredient {
  name: string;
  measure?: string;
}

export interface Recipe {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strYoutube?: string;
  [key: string]: any;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ShoppingItem {
  name: string;
  measure: string;
  recipeName: string;
  checked: boolean;
}

export type Tab = 'search' | 'favorites' | 'shopping';
