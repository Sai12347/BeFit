import { ACTIVITY_LEVELS, GOALS } from '@/types';

export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: string
): number {
  // Mifflin-St Jeor Equation
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === 'male' ? base + 5 : base - 161;
}

export function calculateDailyCalories(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: string,
  activityLevel: string,
  goal: string
): number {
  const bmr = calculateBMR(weightKg, heightCm, age, gender);
  const activity = ACTIVITY_LEVELS.find((a) => a.value === activityLevel);
  const factor = activity ? activity.factor : 1.2;
  const tdee = bmr * factor;
  const goalData = GOALS.find((g) => g.value === goal);
  const adjust = goalData ? goalData.calorieAdjust : 0;
  return Math.max(1200, Math.round(tdee + adjust));
}

export function calculateMacros(calories: number, goal: string = 'maintain') {
  const goalData = GOALS.find((g) => g.value === goal);
  const proteinPct = goalData?.proteinPct ?? 0.3;
  const carbsPct = goalData?.carbsPct ?? 0.4;
  const fatPct = goalData?.fatPct ?? 0.3;

  return {
    protein: Math.round((calories * proteinPct) / 4),
    carbs: Math.round((calories * carbsPct) / 4),
    fat: Math.round((calories * fatPct) / 9),
  };
}

export function calculateBMI(weightKg: number, heightCm: number): number {
  if (!heightCm || !weightKg) return 0;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export function bmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-500' };
  if (bmi < 25) return { label: 'Normal', color: 'text-primary-600' };
  if (bmi < 30) return { label: 'Overweight', color: 'text-amber-500' };
  return { label: 'Obese', color: 'text-red-500' };
}

export interface DietPlanMeal {
  name: string;
  mealType: string;
  targetCalories: number;
  description: string;
  suggestedFoods: string[];
}

export function generateDietPlan(
  calories: number,
  goal: string,
  dietaryPreference: string
): DietPlanMeal[] {
  const goalData = GOALS.find((g) => g.value === goal);
  const isLowCarb = (goalData?.carbsPct ?? 0.4) < 0.3;
  const isVegan = dietaryPreference === 'vegan';
  const isVegetarian = dietaryPreference === 'vegetarian' || isVegan;
  const isGlutenFree = dietaryPreference === 'gluten_free';
  const isKeto = dietaryPreference === 'keto';
  const isPaleo = dietaryPreference === 'paleo';

  const breakfastCalories = Math.round(calories * 0.25);
  const lunchCalories = Math.round(calories * 0.3);
  const dinnerCalories = Math.round(calories * 0.3);
  const snackCalories = calories - breakfastCalories - lunchCalories - dinnerCalories;

  const breakfastFoods = isLowCarb || isKeto
    ? ['Eggs', 'Avocado', 'Spinach', 'Greek Yogurt']
    : isPaleo
    ? ['Eggs', 'Avocado', 'Blueberries', 'Almonds']
    : ['Oatmeal', 'Banana', 'Eggs', 'Greek Yogurt'];

  const lunchFoods = isVegan
    ? ['Tofu', 'Quinoa', 'Kale', 'Avocado', 'Chickpeas']
    : isVegetarian
    ? ['Lentils', 'Quinoa', 'Spinach', 'Greek Yogurt', 'Chickpeas']
    : isPaleo
    ? ['Chicken Breast', 'Sweet Potato', 'Broccoli', 'Avocado']
    : isLowCarb || isKeto
    ? ['Chicken Breast', 'Spinach', 'Avocado', 'Eggs']
    : ['Chicken Breast', 'Brown Rice', 'Broccoli', 'Carrots'];

  const dinnerFoods = isVegan
    ? ['Tofu', 'Sweet Potato', 'Bell Pepper', 'Kale', 'Lentils']
    : isVegetarian
    ? ['Lentils', 'Brown Rice', 'Bell Pepper', 'Cottage Cheese']
    : isPaleo
    ? ['Salmon', 'Sweet Potato', 'Asparagus', 'Avocado']
    : isLowCarb || isKeto
    ? ['Salmon', 'Broccoli', 'Spinach', 'Almonds']
    : ['Salmon', 'Quinoa', 'Spinach', 'Tomato'];

  const snackFoods = isVegan
    ? ['Almonds', 'Dark Chocolate', 'Hummus', 'Apple']
    : ['Almonds', 'Greek Yogurt', 'Apple', 'Peanut Butter'];

  return [
    {
      name: 'Breakfast',
      mealType: 'breakfast',
      targetCalories: breakfastCalories,
      description: 'Start your day with energy',
      suggestedFoods: breakfastFoods,
    },
    {
      name: 'Lunch',
      mealType: 'lunch',
      targetCalories: lunchCalories,
      description: 'Fuel your afternoon',
      suggestedFoods: lunchFoods,
    },
    {
      name: 'Dinner',
      mealType: 'dinner',
      targetCalories: dinnerCalories,
      description: 'Nourish and recover',
      suggestedFoods: dinnerFoods,
    },
    {
      name: 'Snacks',
      mealType: 'snack',
      targetCalories: snackCalories,
      description: 'Keep hunger at bay',
      suggestedFoods: snackFoods,
    },
  ];
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function todayString(): string {
  return formatDate(new Date());
}

export function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function mealTypeLabel(mealType: string): string {
  return mealType.charAt(0).toUpperCase() + mealType.slice(1);
}

export function mealTypeIcon(mealType: string): string {
  switch (mealType) {
    case 'breakfast': return '🌅';
    case 'lunch': return '☀️';
    case 'dinner': return '🌙';
    case 'snack': return '🍎';
    default: return '🍽️';
  }
}
