export interface Profile {
  id: string;
  name: string | null;
  age: number | null;
  gender: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level: string;
  goal: string;
  dietary_preference: string;
  daily_calorie_goal: number;
  protein_goal: number;
  carbs_goal: number;
  fat_goal: number;
  created_at: string;
  updated_at: string;
}

export interface Food {
  id: string;
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size: string;
  dietary_tags: string[];
  is_custom: boolean;
  user_id: string | null;
  created_at: string;
}

export interface Meal {
  id: string;
  user_id: string;
  date: string;
  meal_type: string;
  name: string | null;
  created_at: string;
  meal_items?: MealItem[];
}

export interface MealItem {
  id: string;
  meal_id: string;
  food_id: string;
  quantity: number;
  created_at: string;
  food?: Food;
}

export interface WeightLog {
  id: string;
  user_id: string;
  date: string;
  weight_kg: number;
  created_at: string;
}

export interface MealTemplate {
  id: string;
  user_id: string;
  name: string;
  meal_type: string;
  created_at: string;
  meal_template_items?: MealTemplateItem[];
}

export interface MealTemplateItem {
  id: string;
  template_id: string;
  food_id: string;
  quantity: number;
  created_at: string;
  food?: Food;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export const ACTIVITY_LEVELS: { value: string; label: string; factor: number }[] = [
  { value: 'sedentary', label: 'Sedentary (little or no exercise)', factor: 1.2 },
  { value: 'light', label: 'Light (exercise 1-3 days/week)', factor: 1.375 },
  { value: 'moderate', label: 'Moderate (exercise 3-5 days/week)', factor: 1.55 },
  { value: 'active', label: 'Active (exercise 6-7 days/week)', factor: 1.725 },
  { value: 'very_active', label: 'Very Active (intense daily exercise)', factor: 1.9 },
];

export const GOALS: { value: string; label: string; description: string; calorieAdjust: number; proteinPct: number; carbsPct: number; fatPct: number }[] = [
  { value: 'lose', label: 'Lose Weight', description: 'Steady weight loss with balanced nutrition', calorieAdjust: -500, proteinPct: 0.35, carbsPct: 0.35, fatPct: 0.30 },
  { value: 'fat_burn', label: 'Fat Burn', description: 'High protein, low carb for maximum fat loss', calorieAdjust: -600, proteinPct: 0.40, carbsPct: 0.25, fatPct: 0.35 },
  { value: 'maintain', label: 'Maintain', description: 'Keep your current weight with balanced macros', calorieAdjust: 0, proteinPct: 0.30, carbsPct: 0.40, fatPct: 0.30 },
  { value: 'build_muscle', label: 'Build Muscle', description: 'High protein and carbs for muscle growth', calorieAdjust: 400, proteinPct: 0.35, carbsPct: 0.45, fatPct: 0.20 },
  { value: 'gain', label: 'Gain Weight', description: 'Calorie surplus for healthy weight gain', calorieAdjust: 500, proteinPct: 0.30, carbsPct: 0.45, fatPct: 0.25 },
];

export function goalLabel(value: string): string {
  return GOALS.find((g) => g.value === value)?.label ?? value;
}

export const DIETARY_PREFERENCES: { value: string; label: string }[] = [
  { value: 'none', label: 'No Restrictions' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten_free', label: 'Gluten-Free' },
  { value: 'keto', label: 'Keto' },
  { value: 'paleo', label: 'Paleo' },
];

export const FOOD_CATEGORIES: { value: string; label: string }[] = [
  { value: 'fruits', label: 'Fruits' },
  { value: 'vegetables', label: 'Vegetables' },
  { value: 'proteins', label: 'Proteins' },
  { value: 'grains', label: 'Grains' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'snacks', label: 'Snacks' },
  { value: 'beverages', label: 'Beverages' },
  { value: 'other', label: 'Other' },
];
