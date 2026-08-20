import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner, ErrorState } from '@/components/ui';
import { calculateDailyCalories, calculateMacros } from '@/lib/utils';
import {
  ACTIVITY_LEVELS,
  GOALS,
  DIETARY_PREFERENCES,
  Profile,
} from '@/types';
import { User as UserIcon, Save, Check, Sparkles } from 'lucide-react';

export function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState<Partial<Profile>>({});

  useEffect(() => {
    if (profile) {
      setForm(profile);
      setLoading(false);
    }
  }, [profile]);

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function autoCalculate() {
    const { weight_kg, height_cm, age, gender, activity_level, goal } = form;
    if (weight_kg && height_cm && age && gender && activity_level && goal) {
      const calories = calculateDailyCalories(
        Number(weight_kg),
        Number(height_cm),
        Number(age),
        gender,
        activity_level,
        goal
      );
      const macros = calculateMacros(calories, goal);
      setForm((prev) => ({
        ...prev,
        daily_calorie_goal: calories,
        protein_goal: macros.protein,
        carbs_goal: macros.carbs,
        fat_goal: macros.fat,
      }));
    }
  }

  async function handleSave() {
    setError(null);
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        name: form.name,
        age: form.age,
        gender: form.gender,
        height_cm: form.height_cm,
        weight_kg: form.weight_kg,
        activity_level: form.activity_level,
        goal: form.goal,
        dietary_preference: form.dietary_preference,
        daily_calorie_goal: form.daily_calorie_goal,
        protein_goal: form.protein_goal,
        carbs_goal: form.carbs_goal,
        fat_goal: form.fat_goal,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile?.id);

    setSaving(false);

    if (error) {
      setError(error.message);
    } else {
      setSaved(true);
      await refreshProfile();
      setTimeout(() => setSaved(false), 2500);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-700 font-display font-bold text-2xl">
          {form.name?.charAt(0).toUpperCase() ?? '?'}
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-neutral-800">{form.name ?? 'Your Profile'}</h1>
          <p className="text-neutral-500">Manage your health info and goals</p>
        </div>
      </div>

      {error && <ErrorState message={error} />}

      {/* Personal info */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserIcon className="w-5 h-5 text-primary-600" />
          <h2 className="font-display font-semibold text-neutral-800">Personal Information</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Name</label>
            <input type="text" value={form.name ?? ''} onChange={(e) => update('name', e.target.value)} className="input-field" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Age</label>
              <input type="number" value={form.age ?? ''} onChange={(e) => update('age', Number(e.target.value))} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Gender</label>
              <select value={form.gender ?? 'male'} onChange={(e) => update('gender', e.target.value)} className="input-field">
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Height (cm)</label>
              <input type="number" value={form.height_cm ?? ''} onChange={(e) => update('height_cm', Number(e.target.value))} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Weight (kg)</label>
              <input type="number" step="0.1" value={form.weight_kg ?? ''} onChange={(e) => update('weight_kg', Number(e.target.value))} className="input-field" />
            </div>
          </div>
        </div>
      </div>

      {/* Activity and goal */}
      <div className="card p-6">
        <h2 className="font-display font-semibold text-neutral-800 mb-4">Activity & Goals</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Activity Level</label>
            <select value={form.activity_level ?? 'sedentary'} onChange={(e) => update('activity_level', e.target.value)} className="input-field">
              {ACTIVITY_LEVELS.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Goal</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
              {GOALS.map((g) => (
                <button
                  key={g.value}
                  onClick={() => update('goal', g.value)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    form.goal === g.value
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Dietary Preference</label>
            <select value={form.dietary_preference ?? 'none'} onChange={(e) => update('dietary_preference', e.target.value)} className="input-field">
              {DIETARY_PREFERENCES.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Nutrition goals */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-neutral-800">Daily Nutrition Goals</h2>
          <button
            onClick={autoCalculate}
            className="flex items-center gap-1.5 text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors"
          >
            <Sparkles className="w-4 h-4" /> Auto-calculate
          </button>
        </div>

        <p className="text-xs text-neutral-400 mb-4">
          Fill in your personal info, activity level, and goal above, then click auto-calculate to get recommended values.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Daily Calorie Goal</label>
            <input type="number" value={form.daily_calorie_goal ?? 2000} onChange={(e) => update('daily_calorie_goal', Number(e.target.value))} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Protein Goal (g)</label>
            <input type="number" value={form.protein_goal ?? 150} onChange={(e) => update('protein_goal', Number(e.target.value))} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Carbs Goal (g)</label>
            <input type="number" value={form.carbs_goal ?? 200} onChange={(e) => update('carbs_goal', Number(e.target.value))} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Fat Goal (g)</label>
            <input type="number" value={form.fat_goal ?? 65} onChange={(e) => update('fat_goal', Number(e.target.value))} className="input-field" />
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3 sticky bottom-20 md:bottom-0 bg-neutral-100 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2 flex-1 justify-center"
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" /> Saved!
            </>
          ) : saving ? (
            'Saving...'
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}
