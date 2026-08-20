import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/ui';
import { todayString, formatShortDate } from '@/lib/utils';
import { WeightLog, Meal, MealItem, Food } from '@/types';
import { Scale, TrendingDown, TrendingUp, Plus, Flame } from 'lucide-react';

export function ProgressPage() {
  const { profile } = useAuth();
  const [weights, setWeights] = useState<WeightLog[]>([]);
  const [mealHistory, setMealHistory] = useState<{ date: string; calories: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLogWeight, setShowLogWeight] = useState(false);
  const [newWeight, setNewWeight] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);

    const [weightsRes, mealsRes] = await Promise.all([
      supabase
        .from('weight_logs')
        .select('*')
        .order('date', { ascending: true }),
      supabase
        .from('meals')
        .select(`
          date,
          meal_items (
            quantity,
            food (
              calories
            )
          )
        `)
        .gte('date', new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]),
    ]);

    if (weightsRes.error) setError(weightsRes.error.message);
    else setWeights((weightsRes.data as WeightLog[]) ?? []);

    if (mealsRes.error) setError(mealsRes.error.message);
    else {
      const mealData = mealsRes.data as unknown as { date: string; meal_items: { quantity: number; food: { calories: number } }[] }[];
      const byDate: Record<string, number> = {};
      mealData?.forEach((m) => {
        const cal = m.meal_items?.reduce((sum, item) => sum + item.food.calories * (Number(item.quantity) || 1), 0) ?? 0;
        byDate[m.date] = (byDate[m.date] ?? 0) + cal;
      });
      const sorted = Object.entries(byDate)
        .map(([date, calories]) => ({ date, calories }))
        .sort((a, b) => a.date.localeCompare(b.date));
      setMealHistory(sorted);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function logWeight() {
    if (!newWeight || Number(newWeight) <= 0) return;
    setError(null);

    const today = todayString();
    const existing = weights.find((w) => w.date === today);

    if (existing) {
      const { error } = await supabase
        .from('weight_logs')
        .update({ weight_kg: Number(newWeight) })
        .eq('id', existing.id);
      if (error) {
        setError(error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from('weight_logs')
        .insert({ date: today, weight_kg: Number(newWeight) });
      if (error) {
        setError(error.message);
        return;
      }
    }

    setNewWeight('');
    setShowLogWeight(false);
    await loadData();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const latestWeight = weights.length > 0 ? weights[weights.length - 1].weight_kg : profile?.weight_kg ?? 0;
  const startWeight = weights.length > 0 ? weights[0].weight_kg : latestWeight;
  const totalChange = latestWeight - startWeight;
  const goalVerb = profile?.goal === 'lose' || profile?.goal === 'fat_burn' ? 'Losing' : profile?.goal === 'gain' || profile?.goal === 'build_muscle' ? 'Gaining' : 'Maintaining';
  const isPositiveProgress =
    profile?.goal === 'lose' || profile?.goal === 'fat_burn' ? totalChange < 0 :
    profile?.goal === 'gain' || profile?.goal === 'build_muscle' ? totalChange > 0 :
    Math.abs(totalChange) < 1;

  // Calculate streak
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const dateStr = new Date(today.getTime() - i * 86400000).toISOString().split('T')[0];
    const hasData = mealHistory.some((m) => m.date === dateStr);
    if (hasData) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  const avgCalories = mealHistory.length > 0
    ? Math.round(mealHistory.reduce((sum, m) => sum + m.calories, 0) / mealHistory.length)
    : 0;

  // Chart calculations
  const maxWeight = Math.max(...weights.map((w) => w.weight_kg), latestWeight, startWeight);
  const minWeight = Math.min(...weights.map((w) => w.weight_kg), latestWeight, startWeight);
  const weightRange = maxWeight - minWeight || 1;

  const maxCalories = Math.max(...mealHistory.map((m) => m.calories), profile?.daily_calorie_goal ?? 2000, 1);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-neutral-800">Progress</h1>
          <p className="text-neutral-500 mt-1">Track your journey over time</p>
        </div>
        <button onClick={() => { setNewWeight(latestWeight ? String(latestWeight) : ''); setShowLogWeight(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Log Weight
        </button>
      </div>

      {error && <ErrorState message={error} />}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Scale className="w-4 h-4 text-primary-600" />
            <span className="text-xs font-medium text-neutral-500">Current Weight</span>
          </div>
          <p className="text-2xl font-display font-bold text-neutral-800">{latestWeight} <span className="text-base text-neutral-400">kg</span></p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            {totalChange < 0 ? <TrendingDown className="w-4 h-4 text-primary-600" /> : <TrendingUp className="w-4 h-4 text-amber-500" />}
            <span className="text-xs font-medium text-neutral-500">Total Change</span>
          </div>
          <p className={`text-2xl font-display font-bold ${totalChange < 0 ? 'text-primary-600' : totalChange > 0 ? 'text-amber-600' : 'text-neutral-700'}`}>
            {totalChange === 0 ? '—' : `${totalChange > 0 ? '+' : ''}${totalChange.toFixed(1)} kg`}
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-accent-500" />
            <span className="text-xs font-medium text-neutral-500">Avg Daily Calories</span>
          </div>
          <p className="text-2xl font-display font-bold text-neutral-800">{avgCalories}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">🔥</span>
            <span className="text-xs font-medium text-neutral-500">Logging Streak</span>
          </div>
          <p className="text-2xl font-display font-bold text-neutral-800">{streak} <span className="text-base text-neutral-400">days</span></p>
        </div>
      </div>

      {/* Weight chart */}
      <div className="card p-6">
        <h2 className="font-display font-semibold text-neutral-800 mb-1">Weight Trend</h2>
        <p className="text-sm text-neutral-400 mb-6">
          {goalVerb} weight · {isPositiveProgress ? 'On track!' : 'Keep going!'}
        </p>

        {weights.length === 0 ? (
          <EmptyState
            icon={<Scale className="w-8 h-8" />}
            title="No weight logs yet"
            description="Log your weight to start tracking your progress over time."
            action={
              <button onClick={() => setShowLogWeight(true)} className="btn-primary inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Log Your Weight
              </button>
            }
          />
        ) : (
          <>
            {/* SVG line chart */}
            <div className="relative h-48 mb-4">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map((y) => (
                  <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#f5f5f4" strokeWidth="0.5" />
                ))}

                {/* Goal area (subtle) */}
                {weights.length > 1 && (
                  <polyline
                    points={weights.map((w, i) => {
                      const x = (i / (weights.length - 1)) * 100;
                      const y = 100 - ((w.weight_kg - minWeight) / weightRange) * 80 - 10;
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                )}

                {/* Data points */}
                {weights.map((w, i) => {
                  const x = weights.length > 1 ? (i / (weights.length - 1)) * 100 : 50;
                  const y = 100 - ((w.weight_kg - minWeight) / weightRange) * 80 - 10;
                  return (
                    <circle key={w.id} cx={x} cy={y} r="1.5" fill="#22c55e" vectorEffect="non-scaling-stroke" />
                  );
                })}
              </svg>
            </div>

            {/* Recent weight entries */}
            <div className="space-y-2">
              {[...weights].reverse().slice(0, 7).map((w, i, arr) => {
                const prev = arr[i + 1];
                const diff = prev ? w.weight_kg - prev.weight_kg : 0;
                return (
                  <div key={w.id} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-neutral-500 font-medium">{formatShortDate(w.date)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {prev && (
                        <span className={`text-xs font-medium ${diff < 0 ? 'text-primary-600' : diff > 0 ? 'text-amber-600' : 'text-neutral-400'}`}>
                          {diff === 0 ? '—' : `${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg`}
                        </span>
                      )}
                      <span className="font-semibold text-neutral-800">{w.weight_kg} kg</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Calorie history chart */}
      <div className="card p-6">
        <h2 className="font-display font-semibold text-neutral-800 mb-1">Calorie Intake History</h2>
        <p className="text-sm text-neutral-400 mb-6">Last {mealHistory.length} days with logged meals</p>

        {mealHistory.length === 0 ? (
          <EmptyState
            icon={<Flame className="w-8 h-8" />}
            title="No meal history yet"
            description="Log meals to see your daily calorie intake over time."
          />
        ) : (
          <>
            <div className="flex items-end gap-1.5 h-40 mb-3 overflow-x-auto">
              {mealHistory.slice(-14).map((m) => {
                const heightPct = (m.calories / maxCalories) * 100;
                const goalPct = ((profile?.daily_calorie_goal ?? 2000) / maxCalories) * 100;
                const overGoal = m.calories > (profile?.daily_calorie_goal ?? 2000);
                return (
                  <div key={m.date} className="flex flex-col items-center gap-1 flex-shrink-0" style={{ width: '32px' }}>
                    <div className="text-[10px] font-semibold text-neutral-600">{Math.round(m.calories)}</div>
                    <div className="w-7 rounded-t-lg relative" style={{ height: `${heightPct * 1.4}px`, minHeight: '4px' }}>
                      <div className={`w-full h-full rounded-t-lg ${overGoal ? 'bg-amber-400' : 'bg-primary-400'}`} />
                      {/* Goal line indicator */}
                      <div
                        className="absolute left-0 right-0 border-t-2 border-dashed border-neutral-300"
                        style={{ bottom: `${(100 - goalPct) * 1.4}px` }}
                      />
                    </div>
                    <div className="text-[9px] text-neutral-400">{formatShortDate(m.date).split(' ')[1]}</div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 text-xs text-neutral-500">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-primary-400" /> Under goal
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-amber-400" /> Over goal
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0 border-t-2 border-dashed border-neutral-300" /> Daily goal
              </div>
            </div>
          </>
        )}
      </div>

      {/* Log weight modal */}
      {showLogWeight && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-neutral-900/40 animate-fade-in" onClick={() => setShowLogWeight(false)}>
          <div className="bg-white w-full md:max-w-sm md:rounded-2xl rounded-t-2xl p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display font-semibold text-neutral-800 mb-1">Log Your Weight</h3>
            <p className="text-sm text-neutral-400 mb-4">Today's weight entry</p>

            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              placeholder="e.g. 72.5"
              className="input-field mb-4"
              autoFocus
            />

            {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

            <div className="flex gap-3">
              <button onClick={() => setShowLogWeight(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={logWeight} className="btn-primary flex-1">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
