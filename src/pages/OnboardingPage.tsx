import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import {
  calculateDailyCalories,
  calculateMacros,
  calculateBMI,
  bmiCategory,
  generateDietPlan,
  todayString,
} from '@/lib/utils';
import {
  ACTIVITY_LEVELS,
  GOALS,
  DIETARY_PREFERENCES,
  Profile,
} from '@/types';
import { Leaf, ChevronRight, ChevronLeft, Check, Flame, TrendingDown, Zap, Dumbbell, Scale, Apple } from 'lucide-react';

const GOAL_ICONS: Record<string, typeof TrendingDown> = {
  lose: TrendingDown,
  fat_burn: Flame,
  maintain: Scale,
  build_muscle: Dumbbell,
  gain: Zap,
};

export function OnboardingPage() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(profile?.name ?? '');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [activityLevel, setActivityLevel] = useState('sedentary');
  const [goal, setGoal] = useState('lose');
  const [dietaryPreference, setDietaryPreference] = useState('none');

  const totalSteps = 4;

  const canProceed = () => {
    if (step === 0) return name.trim().length > 0 && age && Number(age) > 0;
    if (step === 1) return heightCm && Number(heightCm) > 0 && weightKg && Number(weightKg) > 0;
    if (step === 2) return activityLevel && goal;
    if (step === 3) return true;
    return false;
  };

  const calculatedCalories = calculateDailyCalories(
    Number(weightKg) || 70,
    Number(heightCm) || 170,
    Number(age) || 25,
    gender,
    activityLevel,
    goal
  );
  const calculatedMacros = calculateMacros(calculatedCalories, goal);
  const bmi = calculateBMI(Number(weightKg) || 70, Number(heightCm) || 170);
  const bmiCat = bmiCategory(bmi);
  const dietPlan = generateDietPlan(calculatedCalories, goal, dietaryPreference);
  const goalData = GOALS.find((g) => g.value === goal);

  async function handleFinish() {
    setSaving(true);

    await supabase.from('weight_logs').insert({
      date: todayString(),
      weight_kg: Number(weightKg),
    });

    const { error } = await supabase
      .from('profiles')
      .update({
        name: name.trim(),
        age: Number(age),
        gender,
        height_cm: Number(heightCm),
        weight_kg: Number(weightKg),
        activity_level: activityLevel,
        goal,
        dietary_preference: dietaryPreference,
        daily_calorie_goal: calculatedCalories,
        protein_goal: calculatedMacros.protein,
        carbs_goal: calculatedMacros.carbs,
        fat_goal: calculatedMacros.fat,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile?.id);

    setSaving(false);

    if (error) {
      console.error('Profile update error:', error);
    } else {
      await refreshProfile();
      navigate('/dashboard');
    }
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-display font-bold text-neutral-800">BeFit</span>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full flex-1 transition-all duration-300 ${
                i <= step ? 'bg-primary-600' : 'bg-neutral-200'
              }`}
            />
          ))}
        </div>

        <div className="card p-6 md:p-8 animate-fade-in">
          {/* Step 0: Personal info */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-display font-bold text-neutral-800">Tell us about you</h2>
                <p className="text-sm text-neutral-500 mt-1">We'll use this to personalize your plan</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="input-field"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="25"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Gender</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setGender('male')}
                      className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                        gender === 'male' ? 'bg-primary-600 text-white' : 'bg-neutral-50 text-neutral-600 border border-neutral-200'
                      }`}
                    >
                      Male
                    </button>
                    <button
                      onClick={() => setGender('female')}
                      className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                        gender === 'female' ? 'bg-primary-600 text-white' : 'bg-neutral-50 text-neutral-600 border border-neutral-200'
                      }`}
                    >
                      Female
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Body metrics */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-display font-bold text-neutral-800">Your body metrics</h2>
                <p className="text-sm text-neutral-500 mt-1">This determines your calorie needs</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Height (cm)</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  placeholder="170"
                  className="input-field"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Current Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="70"
                  className="input-field"
                />
              </div>

              {heightCm && weightKg && Number(heightCm) > 0 && Number(weightKg) > 0 && (
                <div className="bg-primary-50 rounded-xl p-4 animate-scale-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-neutral-600">Your BMI</span>
                      <div className="text-2xl font-display font-bold text-primary-700">{bmi}</div>
                    </div>
                    <span className={`text-sm font-semibold ${bmiCat.color}`}>{bmiCat.label}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Activity + Goal */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-display font-bold text-neutral-800">What's your goal?</h2>
                <p className="text-sm text-neutral-500 mt-1">Choose what you want to achieve</p>
              </div>

              <div className="space-y-2">
                {GOALS.map((g) => {
                  const Icon = GOAL_ICONS[g.value] ?? Scale;
                  return (
                    <button
                      key={g.value}
                      onClick={() => setGoal(g.value)}
                      className={`w-full flex items-start gap-3 p-4 rounded-xl text-left transition-all ${
                        goal === g.value
                          ? 'bg-primary-50 border-2 border-primary-500'
                          : 'bg-neutral-50 border-2 border-transparent hover:bg-neutral-100'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        goal === g.value ? 'bg-primary-600 text-white' : 'bg-neutral-200 text-neutral-500'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-neutral-800">{g.label}</div>
                        <div className="text-sm text-neutral-500 mt-0.5">{g.description}</div>
                      </div>
                      {goal === g.value && (
                        <Check className="w-5 h-5 text-primary-600 flex-shrink-0 mt-2" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Activity Level</label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                  className="input-field"
                >
                  {ACTIVITY_LEVELS.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Dietary Preference</label>
                <select
                  value={dietaryPreference}
                  onChange={(e) => setDietaryPreference(e.target.value)}
                  className="input-field"
                >
                  {DIETARY_PREFERENCES.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Diet plan summary */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-display font-bold text-neutral-800">Your personalized plan</h2>
                <p className="text-sm text-neutral-500 mt-1">
                  Based on your inputs, here's your recommended daily intake
                </p>
              </div>

              {/* Calorie + macro summary */}
              <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-5 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="w-5 h-5" />
                  <span className="font-display font-semibold">{goalData?.label} Plan</span>
                </div>
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div>
                    <div className="text-2xl font-display font-bold">{calculatedCalories}</div>
                    <div className="text-xs text-white/80">Calories</div>
                  </div>
                  <div>
                    <div className="text-2xl font-display font-bold">{calculatedMacros.protein}g</div>
                    <div className="text-xs text-white/80">Protein</div>
                  </div>
                  <div>
                    <div className="text-2xl font-display font-bold">{calculatedMacros.carbs}g</div>
                    <div className="text-xs text-white/80">Carbs</div>
                  </div>
                  <div>
                    <div className="text-2xl font-display font-bold">{calculatedMacros.fat}g</div>
                    <div className="text-xs text-white/80">Fat</div>
                  </div>
                </div>
              </div>

              {/* Meal plan breakdown */}
              <div className="space-y-3">
                {dietPlan.map((meal) => (
                  <div key={meal.mealType} className="bg-neutral-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {meal.mealType === 'breakfast' ? '🌅' : meal.mealType === 'lunch' ? '☀️' : meal.mealType === 'dinner' ? '🌙' : '🍎'}
                        </span>
                        <div>
                          <div className="font-semibold text-neutral-800 text-sm">{meal.name}</div>
                          <div className="text-xs text-neutral-400">{meal.description}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary-600">{meal.targetCalories}</div>
                        <div className="text-xs text-neutral-400">kcal</div>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-wrap mt-2">
                      {meal.suggestedFoods.map((food) => (
                        <span key={food} className="text-xs px-2 py-1 rounded-lg bg-white text-neutral-600 font-medium border border-neutral-200">
                          {food}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 rounded-xl p-3 flex items-start gap-2">
                <Apple className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                  This is a starting recommendation. You can adjust your goals anytime in your Profile settings.
                </p>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center gap-3 mt-6">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="btn-secondary flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            {step < totalSteps - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="btn-primary flex-1 flex items-center justify-center gap-1"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={saving}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Start My Plan
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-neutral-400 mt-6">
          Step {step + 1} of {totalSteps}
        </p>
      </div>
    </div>
  );
}
