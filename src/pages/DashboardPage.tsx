import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { MacroRing, ProgressBar, LoadingSpinner, EmptyState } from '@/components/ui';
import { todayString, formatDisplayDate, mealTypeLabel, generateDietPlan } from '@/lib/utils';
import { goalLabel } from '@/types';
import { Meal, MealItem, WeightLog } from '@/types';
import { Plus, TrendingUp, UtensilsCrossed, Scale, Flame, Target, Apple, ChevronRight } from 'lucide-react';

interface MealWithItems extends Meal {
  meal_items: (MealItem & { food: { name: string; calories: number; protein: number; carbs: number; fat: number } })[];
}

export function DashboardPage() {
  const { profile } = useAuth();
  const [meals, setMeals] = useState<MealWithItems[]>([]);
  const [recentWeights, setRecentWeights] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const today = todayString();

      const [mealsRes, weightsRes] = await Promise.all([
        supabase
          .from('meals')
          .select(`
            *,
            meal_items (
              *,
              food (
                name, calories, protein, carbs, fat
              )
            )
          `)
          .eq('date', today)
          .order('meal_type'),
        supabase
          .from('weight_logs')
          .select('*')
          .order('date', { ascending: false })
          .limit(7),
      ]);

      setMeals((mealsRes.data as MealWithItems[]) ?? []);
      setRecentWeights((weightsRes.data as WeightLog[]) ?? []);
      setLoading(false);
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const totals = meals.reduce(
    (acc, meal) => {
      meal.meal_items?.forEach((item) => {
        const q = Number(item.quantity) || 1;
        acc.calories += item.food.calories * q;
        acc.protein += item.food.protein * q;
        acc.carbs += item.food.carbs * q;
        acc.fat += item.food.fat * q;
      });
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const calorieGoal = profile?.daily_calorie_goal ?? 2000;
  const proteinGoal = profile?.protein_goal ?? 150;
  const carbsGoal = profile?.carbs_goal ?? 200;
  const fatGoal = profile?.fat_goal ?? 65;

  const latestWeight = recentWeights[0]?.weight_kg ?? profile?.weight_kg ?? 0;
  const startWeight = recentWeights.length > 0 ? recentWeights[recentWeights.length - 1].weight_kg : latestWeight;
  const weightChange = latestWeight - startWeight;

  const greetingName = profile?.name?.split(' ')[0] ?? 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-neutral-800">
          {greeting}, {greetingName}
        </h1>
        <p className="text-neutral-500 mt-1">{formatDisplayDate(todayString())}</p>
      </div>

      {/* Calorie overview card */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <MacroRing
            consumed={totals.calories}
            goal={calorieGoal}
            label="Calories"
            unit=""
            size={140}
            color="#22c55e"
          />
          <div className="flex-1 w-full space-y-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-accent-500" />
              <h2 className="font-display font-semibold text-neutral-800">Today's Nutrition</h2>
            </div>
            <div className="space-y-3">
              <ProgressBar value={totals.protein} max={proteinGoal} label="Protein (g)" color="bg-blue-500" />
              <ProgressBar value={totals.carbs} max={carbsGoal} label="Carbs (g)" color="bg-amber-500" />
              <ProgressBar value={totals.fat} max={fatGoal} label="Fat (g)" color="bg-rose-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-primary-600" />
            <span className="text-xs font-medium text-neutral-500">Goal</span>
          </div>
          <p className="text-sm font-semibold text-neutral-800 capitalize">
            {goalLabel(profile?.goal ?? 'maintain')}
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Scale className="w-4 h-4 text-primary-600" />
            <span className="text-xs font-medium text-neutral-500">Current Weight</span>
          </div>
          <p className="text-sm font-semibold text-neutral-800">{latestWeight} kg</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-primary-600" />
            <span className="text-xs font-medium text-neutral-500">Change</span>
          </div>
          <p className={`text-sm font-semibold ${weightChange < 0 ? 'text-primary-600' : weightChange > 0 ? 'text-amber-600' : 'text-neutral-700'}`}>
            {weightChange === 0 ? 'No change' : `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg`}
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <UtensilsCrossed className="w-4 h-4 text-primary-600" />
            <span className="text-xs font-medium text-neutral-500">Meals Today</span>
          </div>
          <p className="text-sm font-semibold text-neutral-800">{meals.length}</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/meals" className="card p-5 hover:shadow-md transition-shadow group">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center mb-3">
            <Plus className="w-5 h-5 text-primary-600 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="font-display font-semibold text-neutral-800">Log a Meal</h3>
          <p className="text-sm text-neutral-500 mt-0.5">Add foods to today's plan</p>
        </Link>
        <Link to="/progress" className="card p-5 hover:shadow-md transition-shadow group">
          <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center mb-3">
            <Scale className="w-5 h-5 text-accent-600 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="font-display font-semibold text-neutral-800">Log Weight</h3>
          <p className="text-sm text-neutral-500 mt-0.5">Track your progress</p>
        </Link>
      </div>

      {/* Diet plan overview */}
      {profile && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Apple className="w-5 h-5 text-primary-600" />
              <h2 className="font-display font-semibold text-neutral-800">Your Diet Plan</h2>
            </div>
            <Link to="/profile" className="text-sm text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1">
              Adjust <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2.5">
            {generateDietPlan(
              profile.daily_calorie_goal,
              profile.goal,
              profile.dietary_preference
            ).map((meal) => (
              <div key={meal.mealType} className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">
                    {meal.mealType === 'breakfast' ? '🌅' : meal.mealType === 'lunch' ? '☀️' : meal.mealType === 'dinner' ? '🌙' : '🍎'}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-neutral-800">{meal.name}</div>
                    <div className="text-xs text-neutral-400">{meal.suggestedFoods.slice(0, 3).join(', ')}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-primary-600">{meal.targetCalories}</div>
                  <div className="text-xs text-neutral-400">kcal</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's meals */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-neutral-800">Today's Meals</h2>
          <Link to="/meals" className="text-sm text-primary-600 font-medium hover:text-primary-700">
            View all
          </Link>
        </div>

        {meals.length === 0 ? (
          <EmptyState
            icon={<UtensilsCrossed className="w-8 h-8" />}
            title="No meals logged yet"
            description="Start planning your day by adding foods to your meals."
            action={
              <Link to="/meals" className="btn-primary inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Your First Meal
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {meals.map((meal) => {
              const mealCalories = meal.meal_items?.reduce((sum, item) => {
                return sum + item.food.calories * (Number(item.quantity) || 1);
              }, 0) ?? 0;
              return (
                <div key={meal.id} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-lg">
                      {meal.meal_type === 'breakfast' ? '🌅' :
                       meal.meal_type === 'lunch' ? '☀️' :
                       meal.meal_type === 'dinner' ? '🌙' : '🍎'}
                    </div>
                    <div>
                      <div className="font-medium text-neutral-800">{mealTypeLabel(meal.meal_type)}</div>
                      <div className="text-xs text-neutral-400">
                        {meal.meal_items?.length ?? 0} item{(meal.meal_items?.length ?? 0) !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-neutral-800">{Math.round(mealCalories)}</div>
                    <div className="text-xs text-neutral-400">kcal</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
