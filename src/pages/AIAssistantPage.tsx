import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { generateResponse, QUICK_PROMPTS, ChatMessage } from '@/lib/ai-engine';
import { Recipe, MEAL_TYPE_LABELS, MEAL_TYPE_ICONS } from '@/lib/recipes';
import { goalLabel } from '@/types';
import { Sparkles, Send, ChefHat, Clock, Flame, Dumbbell, ChevronDown, ChevronUp, X } from 'lucide-react';

export function AIAssistantPage() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile) {
      setMessages([
        {
          role: 'assistant',
          content: `Hi! I'm your BeFit AI nutrition assistant. I can recommend meals, find recipes, and give you personalized tips for your ${goalLabel(profile.goal)} goal. What would you like help with today?`,
        },
      ]);
    }
  }, [profile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  function handleSend(text?: string) {
    const messageText = (text ?? input).trim();
    if (!messageText || thinking) return;

    const userMessage: ChatMessage = { role: 'user', content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setThinking(true);

    setTimeout(() => {
      const response = generateResponse(messageText, profile);
      setMessages((prev) => [...prev, response]);
      setThinking(false);
    }, 500 + Math.random() * 400);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20 text-neutral-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-8rem)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-neutral-800">AI Nutrition Assistant</h1>
          <p className="text-sm text-neutral-500">
            Recipes & meal plans for your {goalLabel(profile.goal)} goal
          </p>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto card p-4 md:p-6 mb-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${msg.role === 'user' ? '' : 'w-full'}`}>
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-lg bg-primary-100 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary-600" />
                  </div>
                  <span className="text-xs font-semibold text-neutral-600">BeFit AI</span>
                </div>
              )}
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary-600 text-white rounded-tr-sm'
                    : 'bg-neutral-50 text-neutral-700 rounded-tl-sm border border-neutral-100'
                }`}
              >
                {msg.content}
              </div>

              {/* Recipe cards */}
              {msg.recipes && msg.recipes.length > 0 && (
                <div className="mt-3 space-y-3">
                  {msg.recipes.map((recipe) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      isExpanded={expandedRecipe === recipe.id}
                      onToggle={() =>
                        setExpandedRecipe(expandedRecipe === recipe.id ? null : recipe.id)
                      }
                      onView={() => setSelectedRecipe(recipe)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {thinking && (
          <div className="flex justify-start">
            <div className="bg-neutral-50 rounded-2xl rounded-tl-sm border border-neutral-100 px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              className="text-xs px-3 py-2 rounded-xl bg-white border border-neutral-200 text-neutral-600 hover:border-primary-300 hover:text-primary-600 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 bg-white rounded-2xl border border-neutral-200 p-2 shadow-sm">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask for recipes, meal suggestions, or nutrition tips..."
          className="flex-1 px-3 py-2.5 bg-transparent text-sm text-neutral-700 placeholder:text-neutral-400 outline-none"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || thinking}
          className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-700 transition-colors flex-shrink-0"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {/* Recipe detail modal */}
      {selectedRecipe && (
        <RecipeDetailModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
      )}
    </div>
  );
}

function RecipeCard({
  recipe,
  isExpanded,
  onToggle,
  onView,
}: {
  recipe: Recipe;
  isExpanded: boolean;
  onToggle: () => void;
  onView: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-sm transition-shadow">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-lg flex-shrink-0">
              {MEAL_TYPE_ICONS[recipe.mealType]}
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-neutral-800 text-sm truncate">{recipe.name}</h4>
              <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">{recipe.description}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500">
                <span className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-accent-500" /> {recipe.calories} cal
                </span>
                <span className="flex items-center gap-1">
                  <Dumbbell className="w-3.5 h-3.5 text-blue-500" /> {recipe.protein}g
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" /> {recipe.prepTime}
                </span>
                <span className="text-primary-600 font-medium">{MEAL_TYPE_LABELS[recipe.mealType]}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center border-t border-neutral-100">
        <button
          onClick={onToggle}
          className="flex-1 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors flex items-center justify-center gap-1"
        >
          {isExpanded ? (
            <>Hide recipe <ChevronUp className="w-4 h-4" /></>
          ) : (
            <>View recipe <ChevronDown className="w-4 h-4" /></>
          )}
        </button>
        <div className="w-px h-6 bg-neutral-100" />
        <button
          onClick={onView}
          className="flex-1 py-2.5 text-sm text-primary-600 hover:bg-primary-50 transition-colors flex items-center justify-center gap-1 font-medium"
        >
          <ChefHat className="w-4 h-4" /> Full details
        </button>
      </div>

      {isExpanded && (
        <div className="p-4 bg-neutral-50 border-t border-neutral-100 animate-fade-in">
          <div className="mb-3">
            <h5 className="text-xs font-semibold text-neutral-700 mb-1.5">Ingredients</h5>
            <ul className="space-y-1">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="text-xs text-neutral-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-400" /> {ing}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="text-xs font-semibold text-neutral-700 mb-1.5">Instructions</h5>
            <ol className="space-y-1.5">
              {recipe.steps.map((step, i) => (
                <li key={i} className="text-xs text-neutral-600 flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-100 text-primary-600 font-semibold flex items-center justify-center text-[10px]">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
          {recipe.tips && (
            <div className="mt-3 bg-blue-50 rounded-lg p-2.5">
              <p className="text-xs text-blue-700">
                <span className="font-semibold">Tip: </span>{recipe.tips}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RecipeDetailModal({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-neutral-900/40 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-neutral-100 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{MEAL_TYPE_ICONS[recipe.mealType]}</span>
            <div>
              <h3 className="font-display font-bold text-neutral-800">{recipe.name}</h3>
              <p className="text-xs text-neutral-400">{MEAL_TYPE_LABELS[recipe.mealType]} · {recipe.prepTime}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-neutral-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Description */}
          <p className="text-sm text-neutral-600">{recipe.description}</p>

          {/* Macros */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-neutral-50 rounded-xl p-3 text-center">
              <Flame className="w-4 h-4 text-accent-500 mx-auto mb-1" />
              <div className="font-bold text-neutral-800 text-sm">{recipe.calories}</div>
              <div className="text-[10px] text-neutral-400">calories</div>
            </div>
            <div className="bg-neutral-50 rounded-xl p-3 text-center">
              <Dumbbell className="w-4 h-4 text-blue-500 mx-auto mb-1" />
              <div className="font-bold text-neutral-800 text-sm">{recipe.protein}g</div>
              <div className="text-[10px] text-neutral-400">protein</div>
            </div>
            <div className="bg-neutral-50 rounded-xl p-3 text-center">
              <div className="w-4 h-4 mx-auto mb-1 rounded-full bg-amber-400" />
              <div className="font-bold text-neutral-800 text-sm">{recipe.carbs}g</div>
              <div className="text-[10px] text-neutral-400">carbs</div>
            </div>
            <div className="bg-neutral-50 rounded-xl p-3 text-center">
              <div className="w-4 h-4 mx-auto mb-1 rounded-full bg-rose-400" />
              <div className="font-bold text-neutral-800 text-sm">{recipe.fat}g</div>
              <div className="text-[10px] text-neutral-400">fat</div>
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <h4 className="font-display font-semibold text-neutral-800 mb-2 flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-primary-600" /> Ingredients
            </h4>
            <ul className="space-y-1.5">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="text-sm text-neutral-600 flex items-center gap-2 bg-neutral-50 rounded-lg px-3 py-2">
                  <span className="w-2 h-2 rounded-full bg-primary-400" /> {ing}
                </li>
              ))}
            </ul>
          </div>

          {/* Steps */}
          <div>
            <h4 className="font-display font-semibold text-neutral-800 mb-2">Instructions</h4>
            <ol className="space-y-3">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-600 text-white font-semibold flex items-center justify-center text-sm">
                    {i + 1}
                  </span>
                  <p className="text-sm text-neutral-600 pt-1">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Tips */}
          {recipe.tips && (
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-sm text-blue-700">
                <span className="font-semibold">Pro Tip: </span>{recipe.tips}
              </p>
            </div>
          )}

          {/* Dietary tags */}
          <div className="flex flex-wrap gap-2">
            {recipe.dietaryTags.map((tag) => (
              <span key={tag} className="text-xs px-2.5 py-1 rounded-lg bg-primary-50 text-primary-600 font-medium border border-primary-100">
                {tag.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
