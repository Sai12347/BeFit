import { RECIPES, Recipe } from '@/lib/recipes';
import { GOALS, goalLabel } from '@/types';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  recipes?: Recipe[];
}

export function filterRecipes(
  recipes: Recipe[],
  opts: { goal?: string; dietaryPreference?: string; mealType?: string }
): Recipe[] {
  return recipes.filter((r) => {
    if (opts.goal && !r.goals.includes(opts.goal)) return false;
    if (opts.dietaryPreference && opts.dietaryPreference !== 'none') {
      if (!r.dietaryTags.includes(opts.dietaryPreference)) return false;
    }
    if (opts.mealType && r.mealType !== opts.mealType) return false;
    return true;
  });
}

export function recommendMeals(
  goal: string,
  dietaryPreference: string
): Record<string, Recipe[]> {
  const mealTypes = ['breakfast', 'pre_workout', 'lunch', 'post_workout', 'dinner', 'snack'];
  const result: Record<string, Recipe[]> = {};

  for (const mt of mealTypes) {
    const matches = filterRecipes(RECIPES, { goal, dietaryPreference, mealType: mt });
    result[mt] = matches.slice(0, 3);
  }

  return result;
}

export function searchRecipes(query: string): Recipe[] {
  const lower = query.toLowerCase().trim();
  if (!lower) return [];
  return RECIPES.filter((r) => {
    return (
      r.name.toLowerCase().includes(lower) ||
      r.description.toLowerCase().includes(lower) ||
      r.ingredients.some((i) => i.toLowerCase().includes(lower)) ||
      r.mealType.includes(lower) ||
      r.dietaryTags.some((t) => t.includes(lower))
    );
  });
}

interface IntentResult {
  type: 'recommend' | 'recipe_search' | 'meal_plan' | 'tips' | 'unknown';
  query?: string;
  mealType?: string;
}

function detectIntent(message: string): IntentResult {
  const lower = message.toLowerCase().trim();

  // Meal plan / recommendation intent
  if (/\b(recommend|suggest|what should i eat|meal plan|plan for|my plan|today.*eat|what.*eat)\b/.test(lower)) {
    return { type: 'recommend' };
  }

  // Meal type specific
  if (/\b breakfast \b/.test(lower)) return { type: 'recommend', mealType: 'breakfast' };
  if (/\b lunch \b/.test(lower)) return { type: 'recommend', mealType: 'lunch' };
  if (/\b dinner \b/.test(lower)) return { type: 'recommend', mealType: 'dinner' };
  if (/\bpre.?workout\b/.test(lower)) return { type: 'recommend', mealType: 'pre_workout' };
  if (/\bpost.?workout\b/.test(lower)) return { type: 'recommend', mealType: 'post_workout' };
  if (/\b snack \b/.test(lower)) return { type: 'recommend', mealType: 'snack' };

  // Tips / advice
  if (/\b(tip|advice|how to|help me|guide)\b/.test(lower)) {
    return { type: 'tips' };
  }

  // Recipe search — if there's a food/dish keyword
  if (lower.length > 1) {
    return { type: 'recipe_search', query: lower };
  }

  return { type: 'unknown' };
}

function getGoalTip(goal: string): string {
  const goalData = GOALS.find((g) => g.value === goal);
  if (!goalData) return 'Stay consistent with your nutrition and you will see results!';

  switch (goal) {
    case 'lose':
      return `For your ${goalLabel(goal)} goal, focus on a calorie deficit of about 500 calories below your maintenance level. Prioritize protein to preserve muscle, fill up on vegetables for volume, and limit liquid calories. Aim to lose 0.5-0.7 kg per week for sustainable progress.`;
    case 'fat_burn':
      return `For your ${goalLabel(goal)} goal, keep carbs low and protein high to maximize fat loss while preserving muscle. Include plenty of leafy greens, healthy fats from avocado and nuts, and lean protein at every meal. Consider intermittent fasting for enhanced fat burning.`;
    case 'maintain':
      return `For your ${goalLabel(goal)} goal, focus on eating at your maintenance calories with balanced macros. Prioritize whole foods, stay active, and listen to your hunger cues. This is about building sustainable habits for long-term health.`;
    case 'build_muscle':
      return `For your ${goalLabel(goal)} goal, eat in a slight calorie surplus with high protein (1.6-2.2g per kg body weight). Time your carbs around workouts for energy and recovery. Consistency is key — muscle building takes time.`;
    case 'gain':
      return `For your ${goalLabel(goal)} goal, aim for a 300-500 calorie surplus above maintenance. Eat calorie-dense foods like nuts, avocados, and whole grains. Don't skip meals — eating frequently helps you reach your calorie target.`;
    default:
      return 'Stay consistent with your nutrition and you will see results!';
  }
}

export function generateResponse(
  message: string,
  profile: { goal: string; dietary_preference: string; daily_calorie_goal: number; protein_goal: number; carbs_goal: number; fat_goal: number } | null
): ChatMessage {
  const intent = detectIntent(message);

  if (!profile) {
    return {
      role: 'assistant',
      content: 'I would love to help, but I need your profile information first. Please complete your profile setup to get personalized recommendations.',
    };
  }

  switch (intent.type) {
    case 'recommend': {
      const mealType = intent.mealType;
      if (mealType) {
        const recipes = filterRecipes(RECIPES, { goal: profile.goal, dietaryPreference: profile.dietary_preference, mealType });
        if (recipes.length === 0) {
          return {
            role: 'assistant',
            content: `I couldn't find any recipes matching your goal and dietary preference for this meal. Try adjusting your dietary preference in your profile for more options.`,
          };
        }
        return {
          role: 'assistant',
          content: `Here are my top picks for your ${goalLabel(profile.goal)} goal, perfect for this meal:`,
          recipes,
        };
      }

      const recommendations = recommendMeals(profile.goal, profile.dietary_preference);
      const allRecs: Recipe[] = [];
      for (const mt of Object.keys(recommendations)) {
        allRecs.push(...recommendations[mt].slice(0, 1));
      }
      return {
        role: 'assistant',
        content: `Based on your ${goalLabel(profile.goal)} goal and dietary preference, here is a full day of recommended meals. Each one is chosen to help you reach your target of ${profile.daily_calorie_goal} calories with ${profile.protein_goal}g protein, ${profile.carbs_goal}g carbs, and ${profile.fat_goal}g fat.`,
        recipes: allRecs,
      };
    }

    case 'recipe_search': {
      const results = searchRecipes(intent.query ?? '');
      if (results.length === 0) {
        return {
          role: 'assistant',
          content: `I couldn't find any recipes for "${intent.query}". Try searching for an ingredient like "chicken", "tofu", or a meal type like "breakfast".`,
        };
      }
      const filtered = filterRecipes(results, { goal: profile.goal, dietaryPreference: profile.dietary_preference });
      const finalResults = filtered.length > 0 ? filtered : results;
      return {
        role: 'assistant',
        content: `I found ${finalResults.length} recipe${finalResults.length !== 1 ? 's' : ''} for "${intent.query}". ${filtered.length > 0 ? 'These are filtered to match your goal and dietary preference.' : 'Here are all matching recipes — some may not fit your current dietary preference.'}`,
        recipes: finalResults.slice(0, 5),
      };
    }

    case 'tips': {
      return {
        role: 'assistant',
        content: getGoalTip(profile.goal),
      };
    }

    default: {
      return {
        role: 'assistant',
        content: 'I can help you with meal recommendations, recipe ideas, and nutrition tips. Try asking me things like "What should I eat for breakfast?", "Suggest a pre-workout snack", "Give me a chicken recipe", or "Tips for my goal".',
      };
    }
  }
}

export const QUICK_PROMPTS = [
  'What should I eat today?',
  'Suggest a pre-workout meal',
  'Recommend a post-workout meal',
  'Give me a high protein dinner',
  'Tips for my goal',
  'Chicken recipe',
];
