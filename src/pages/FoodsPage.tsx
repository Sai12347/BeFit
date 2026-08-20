import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/ui';
import { Food, FOOD_CATEGORIES, DIETARY_PREFERENCES } from '@/types';
import { Search, Plus, X, Apple, Trash2 } from 'lucide-react';

const TAG_COLORS: Record<string, string> = {
  vegetarian: 'bg-green-50 text-green-600',
  vegan: 'bg-green-50 text-green-700',
  gluten_free: 'bg-blue-50 text-blue-600',
  keto: 'bg-purple-50 text-purple-600',
  paleo: 'bg-orange-50 text-orange-600',
};

export function FoodsPage() {
  const { profile } = useAuth();
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);

  const loadFoods = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('foods')
      .select('*')
      .or(`is_custom.eq.false,user_id.eq.${profile?.id ?? ''}`)
      .order('name');

    if (error) {
      setError(error.message);
    } else {
      setFoods((data as Food[]) ?? []);
    }
    setLoading(false);
  }, [profile?.id]);

  useEffect(() => {
    loadFoods();
  }, [loadFoods]);

  const filteredFoods = foods.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || f.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  async function deleteFood(foodId: string) {
    const { error } = await supabase.from('foods').delete().eq('id', foodId);
    if (error) {
      setError(error.message);
    } else {
      await loadFoods();
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-neutral-800">Food Catalog</h1>
          <p className="text-neutral-500 mt-1">Browse and manage your foods</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Food
        </button>
      </div>

      {error && <ErrorState message={error} />}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search foods by name..."
          className="input-field pl-11"
        />
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
            categoryFilter === 'all' ? 'bg-primary-600 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50 border border-neutral-200'
          }`}
        >
          All
        </button>
        {FOOD_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategoryFilter(cat.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              categoryFilter === cat.value ? 'bg-primary-600 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50 border border-neutral-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Foods list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredFoods.length === 0 ? (
        <EmptyState
          icon={<Apple className="w-8 h-8" />}
          title="No foods found"
          description="Try a different search or add a custom food to your catalog."
          action={
            <button onClick={() => setShowAddForm(true)} className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Custom Food
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredFoods.map((food) => (
            <div key={food.id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-neutral-800 truncate">{food.name}</h3>
                  <p className="text-xs text-neutral-400">{food.serving_size}</p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  {food.is_custom && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent-50 text-accent-600 font-medium">
                      Custom
                    </span>
                  )}
                  {food.is_custom && (
                    <button
                      onClick={() => deleteFood(food.id)}
                      className="w-7 h-7 rounded-lg text-neutral-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold text-neutral-800">{food.calories} kcal</span>
                <span className="text-xs text-neutral-300">·</span>
                <span className="text-xs text-neutral-400">{food.category}</span>
              </div>

              <div className="flex gap-2">
                <span className="text-xs px-2 py-1 rounded-lg bg-blue-50 text-blue-600 font-medium">{food.protein}g protein</span>
                <span className="text-xs px-2 py-1 rounded-lg bg-amber-50 text-amber-600 font-medium">{food.carbs}g carbs</span>
                <span className="text-xs px-2 py-1 rounded-lg bg-rose-50 text-rose-500 font-medium">{food.fat}g fat</span>
              </div>

              {food.dietary_tags && food.dietary_tags.length > 0 && (
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {food.dietary_tags.map((tag) => (
                    <span key={tag} className={`text-xs px-2 py-0.5 rounded-full font-medium ${TAG_COLORS[tag] ?? 'bg-neutral-100 text-neutral-600'}`}>
                      {tag.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add food form modal */}
      {showAddForm && (
        <AddFoodForm
          onClose={() => setShowAddForm(false)}
          onSaved={() => {
            setShowAddForm(false);
            loadFoods();
          }}
        />
      )}
    </div>
  );
}

function AddFoodForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { profile } = useAuth();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('other');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [servingSize, setServingSize] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const allTags = DIETARY_PREFERENCES.filter((p) => p.value !== 'none').map((p) => ({
    value: p.value,
    label: p.label,
  }));

  async function handleSave() {
    setError(null);
    if (!name.trim() || !calories) {
      setError('Name and calories are required.');
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('foods').insert({
      name: name.trim(),
      category,
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      serving_size: servingSize.trim() || '1 serving',
      dietary_tags: tags,
      is_custom: true,
      user_id: profile?.id,
    });

    setSaving(false);

    if (error) {
      setError(error.message);
    } else {
      onSaved();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-neutral-900/40 animate-fade-in" onClick={onClose}>
      <div
        className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-neutral-100 sticky top-0 bg-white z-10">
          <h3 className="font-display font-semibold text-neutral-800">Add Custom Food</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Protein Bar" className="input-field" />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field">
              {FOOD_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Serving Size</label>
            <input type="text" value={servingSize} onChange={(e) => setServingSize(e.target.value)} placeholder="e.g. 1 bar (40g)" className="input-field" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Calories *</label>
              <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="200" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Protein (g)</label>
              <input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="15" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Carbs (g)</label>
              <input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="25" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Fat (g)</label>
              <input type="number" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="6" className="input-field" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Dietary Tags</label>
            <div className="flex gap-2 flex-wrap">
              {allTags.map((tag) => (
                <button
                  key={tag.value}
                  onClick={() => {
                    setTags((prev) =>
                      prev.includes(tag.value)
                        ? prev.filter((t) => t !== tag.value)
                        : [...prev, tag.value]
                    );
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    tags.includes(tag.value)
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : 'Save Food'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
