import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/ui';
import { todayString, formatDisplayDate, mealTypeLabel } from '@/lib/utils';
import { Meal, MealItem, Food, MEAL_TYPES, MealType } from '@/types';
import { Plus, Search, Trash2, X, ChevronLeft, ChevronRight, UtensilsCrossed } from 'lucide-react';

interface MealWithItems extends Meal {
  meal_items: (MealItem & { food: Food })[];
}

export function MealsPage() {
  const { profile } = useAuth();
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [meals, setMeals] = useState<MealWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddFood, setShowAddFood] = useState<MealType | null>(null);
  const [foods, setFoods] = useState<Food[]>([]);
  const [foodSearch, setFoodSearch] = useState('');

  const loadMeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('meals')
      .select(`
        *,
        meal_items (
          *,
          food (*)
        )
      `)
      .eq('date', selectedDate)
      .order('meal_type');

    if (error) {
      setError(error.message);
    } else {
      setMeals((data as MealWithItems[]) ?? []);
    }
    setLoading(false);
  }, [selectedDate]);

  const loadFoods = useCallback(async () => {
    const { data } = await supabase
      .from('foods')
      .select('*')
      .or(`is_custom.eq.false,user_id.eq.${profile?.id ?? ''}`)
      .order('name');
    setFoods((data as Food[]) ?? []);
  }, [profile?.id]);

  useEffect(() => {
    loadMeals();
  }, [loadMeals]);

  useEffect(() => {
    if (showAddFood) loadFoods();
  }, [showAddFood, loadFoods]);

  function changeDate(days: number) {
    const date = new Date(selectedDate + 'T00:00:00');
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  }

  async function ensureMeal(mealType: MealType): Promise<string | null> {
    let meal = meals.find((m) => m.meal_type === mealType);
    if (meal) return meal.id;

    const { data, error } = await supabase
      .from('meals')
      .insert({
        date: selectedDate,
        meal_type: mealType,
      })
      .select('*')
      .single();

    if (error) {
      setError(error.message);
      return null;
    }

    const newMeal = data as Meal;
    setMeals((prev) => [...prev, { ...newMeal, meal_items: [] }]);
    return newMeal.id;
  }

  async function addFoodToMeal(mealId: string, foodId: string, quantity: number) {
    const { error } = await supabase
      .from('meal_items')
      .insert({ meal_id: mealId, food_id: foodId, quantity });

    if (error) {
      setError(error.message);
    } else {
      await loadMeals();
    }
  }

  async function removeMealItem(itemId: string) {
    const { error } = await supabase.from('meal_items').delete().eq('id', itemId);
    if (error) {
      setError(error.message);
    } else {
      await loadMeals();
    }
  }

  async function updateQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
      await removeMealItem(itemId);
      return;
    }
    const { error } = await supabase.from('meal_items').update({ quantity }).eq('id', itemId);
    if (error) {
      setError(error.message);
    } else {
      await loadMeals();
    }
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

  const filteredFoods = foods.filter((f) =>
    f.name.toLowerCase().includes(foodSearch.toLowerCase())
  );

  const isToday = selectedDate === todayString();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with date navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-neutral-800">Meals</h1>
          <p className="text-neutral-500 mt-1">{formatDisplayDate(selectedDate)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => changeDate(-1)} className="w-10 h-10 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-50 flex items-center justify-center transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          {!isToday && (
            <button onClick={() => setSelectedDate(todayString())} className="btn-secondary text-sm py-2">
              Today
            </button>
          )}
          <button onClick={() => changeDate(1)} className="w-10 h-10 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-50 flex items-center justify-center transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && <ErrorState message={error} />}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {/* Daily totals summary */}
          <div className="card p-5">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-display font-bold text-primary-600">{Math.round(totals.calories)}</div>
                <div className="text-xs text-neutral-400 mt-0.5">Calories</div>
              </div>
              <div>
                <div className="text-2xl font-display font-bold text-blue-500">{Math.round(totals.protein)}</div>
                <div className="text-xs text-neutral-400 mt-0.5">Protein (g)</div>
              </div>
              <div>
                <div className="text-2xl font-display font-bold text-amber-500">{Math.round(totals.carbs)}</div>
                <div className="text-xs text-neutral-400 mt-0.5">Carbs (g)</div>
              </div>
              <div>
                <div className="text-2xl font-display font-bold text-rose-400">{Math.round(totals.fat)}</div>
                <div className="text-xs text-neutral-400 mt-0.5">Fat (g)</div>
              </div>
            </div>
          </div>

          {/* Meal sections */}
          <div className="space-y-4">
            {MEAL_TYPES.map((mealType) => {
              const meal = meals.find((m) => m.meal_type === mealType);
              const items = meal?.meal_items ?? [];
              const mealCalories = items.reduce((sum, item) => sum + item.food.calories * (Number(item.quantity) || 1), 0);

              return (
                <div key={mealType} className="card overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-neutral-100">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {mealType === 'breakfast' ? '🌅' : mealType === 'lunch' ? '☀️' : mealType === 'dinner' ? '🌙' : '🍎'}
                      </span>
                      <div>
                        <h3 className="font-display font-semibold text-neutral-800">{mealTypeLabel(mealType)}</h3>
                        <p className="text-xs text-neutral-400">{Math.round(mealCalories)} kcal</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowAddFood(mealType)}
                      className="w-9 h-9 rounded-xl bg-primary-50 hover:bg-primary-100 text-primary-600 flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  {items.length > 0 ? (
                    <div className="divide-y divide-neutral-100">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-4 hover:bg-neutral-50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-neutral-800 truncate">{item.food.name}</div>
                            <div className="text-xs text-neutral-400">{item.food.serving_size}</div>
                          </div>
                          <div className="flex items-center gap-1.5 bg-neutral-100 rounded-lg p-0.5">
                            <button
                              onClick={() => updateQuantity(item.id, Number(item.quantity) - 0.5)}
                              className="w-7 h-7 rounded-md bg-white text-neutral-600 hover:bg-neutral-50 flex items-center justify-center text-sm font-bold transition-colors"
                            >
                              -
                            </button>
                            <span className="text-sm font-semibold text-neutral-700 w-10 text-center">
                              {Number(item.quantity).toString()}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, Number(item.quantity) + 0.5)}
                              className="w-7 h-7 rounded-md bg-white text-neutral-600 hover:bg-neutral-50 flex items-center justify-center text-sm font-bold transition-colors"
                            >
                              +
                            </button>
                          </div>
                          <div className="text-right w-16">
                            <div className="text-sm font-semibold text-neutral-800">
                              {Math.round(item.food.calories * (Number(item.quantity) || 1))}
                            </div>
                            <div className="text-xs text-neutral-400">kcal</div>
                          </div>
                          <button
                            onClick={() => removeMealItem(item.id)}
                            className="w-8 h-8 rounded-lg text-neutral-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4">
                      <p className="text-sm text-neutral-400">No items added yet.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {meals.length === 0 && (
            <EmptyState
              icon={<UtensilsCrossed className="w-8 h-8" />}
              title="No meals for this day"
              description="Tap the + button on any meal type above to start adding foods."
            />
          )}
        </>
      )}

      {/* Add food modal */}
      {showAddFood && (
        <AddFoodModal
          mealType={showAddFood}
          foods={filteredFoods}
          search={foodSearch}
          onSearchChange={setFoodSearch}
          onClose={() => setShowAddFood(null)}
          onAdd={async (foodId, quantity) => {
            const mealId = await ensureMeal(showAddFood);
            if (mealId) {
              await addFoodToMeal(mealId, foodId, quantity);
              setShowAddFood(null);
            }
          }}
        />
      )}
    </div>
  );
}

function AddFoodModal({
  mealType,
  foods,
  search,
  onSearchChange,
  onClose,
  onAdd,
}: {
  mealType: MealType;
  foods: Food[];
  search: string;
  onSearchChange: (v: string) => void;
  onClose: () => void;
  onAdd: (foodId: string, quantity: number) => void;
}) {
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-neutral-900/40 animate-fade-in" onClick={onClose}>
      <div
        className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-100">
          <h3 className="font-display font-semibold text-neutral-800">
            Add to {mealTypeLabel(mealType)}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-neutral-100">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search foods..."
              className="input-field pl-11"
              autoFocus
            />
          </div>
        </div>

        {/* Food list */}
        <div className="flex-1 overflow-y-auto p-2">
          {foods.length === 0 ? (
            <p className="text-center text-neutral-400 py-8 text-sm">No foods found. Try a different search.</p>
          ) : (
            <div className="space-y-1">
              {foods.map((food) => (
                <button
                  key={food.id}
                  onClick={() => setSelectedFood(food)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors ${
                    selectedFood?.id === food.id ? 'bg-primary-50' : 'hover:bg-neutral-50'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-medium text-neutral-800 truncate">{food.name}</div>
                    <div className="text-xs text-neutral-400">{food.serving_size} · {food.calories} kcal</div>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{food.protein}g P</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">{food.carbs}g C</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-500">{food.fat}g F</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer with quantity and add button */}
        {selectedFood && (
          <div className="p-4 border-t border-neutral-100 bg-neutral-50 animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-medium text-neutral-800">{selectedFood.name}</div>
                <div className="text-xs text-neutral-400">
                  {Math.round(selectedFood.calories * quantity)} kcal · {Math.round(selectedFood.protein * quantity)}g protein
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-white rounded-lg p-0.5 border border-neutral-200">
                <button
                  onClick={() => setQuantity(Math.max(0.5, quantity - 0.5))}
                  className="w-8 h-8 rounded-md hover:bg-neutral-100 flex items-center justify-center text-sm font-bold"
                >
                  -
                </button>
                <span className="text-sm font-semibold w-10 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 0.5)}
                  className="w-8 h-8 rounded-md hover:bg-neutral-100 flex items-center justify-center text-sm font-bold"
                >
                  +
                </button>
              </div>
            </div>
            <button
              onClick={() => onAdd(selectedFood.id, quantity)}
              className="btn-primary w-full"
            >
              Add to {mealTypeLabel(mealType)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
