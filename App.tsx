
import React, { useState, useEffect, useCallback } from 'react';
import { Ingredient, Recipe, ShoppingItem, Tab } from './types.ts';
import { fetchRecipesByIngredients, fetchRecipeById } from './services/recipeService.ts';
import IngredientInput from './components/IngredientInput.tsx';
import RecipeCard from './components/RecipeCard.tsx';
import Chatbot from './components/Chatbot.tsx';
import ImageAnalyzer from './components/ImageAnalyzer.tsx';
import RecipeModal from './components/RecipeModal.tsx';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('search');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favorites, setFavorites] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem('chefbot_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(() => {
    const saved = localStorage.getItem('chefbot_shopping');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    localStorage.setItem('chefbot_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('chefbot_shopping', JSON.stringify(shoppingList));
  }, [shoppingList]);

  const handleSearch = async () => {
    if (ingredients.length === 0) return;
    setLoading(true);
    try {
      const results = await fetchRecipesByIngredients(ingredients);
      setRecipes(results);
    } catch (error) {
      console.error("Search error", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (recipe: Recipe) => {
    setFavorites(prev => {
      const exists = prev.find(r => r.idMeal === recipe.idMeal);
      if (exists) return prev.filter(r => r.idMeal !== recipe.idMeal);
      return [...prev, recipe];
    });
  };

  const addToShoppingList = (items: ShoppingItem[]) => {
    setShoppingList(prev => {
      const newList = [...prev];
      items.forEach(item => {
        if (!newList.find(i => i.name === item.name && i.recipeName === item.recipeName)) {
          newList.push(item);
        }
      });
      return newList;
    });
  };

  const toggleShoppingItem = (index: number) => {
    setShoppingList(prev => prev.map((item, i) => i === index ? { ...item, checked: !item.checked } : item));
  };

  const removeShoppingItem = (index: number) => {
    setShoppingList(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg">
              <i className="fa-solid fa-utensils text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">ChefBot Pro</h1>
              <p className="text-xs text-gray-500">Your AI Kitchen Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex bg-gray-100 rounded-full p-1">
                {(['search', 'favorites', 'shopping'] as Tab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                      activeTab === tab ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-8">
        {activeTab === 'search' && (
          <div className="space-y-8">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <i className="fa-solid fa-basket-shopping text-orange-500"></i>
                Pantry Ingredients
              </h2>
              <IngredientInput 
                ingredients={ingredients} 
                setIngredients={setIngredients} 
                onSearch={handleSearch}
                loading={loading}
              />
              <div className="mt-6 pt-6 border-t border-gray-50">
                <ImageAnalyzer onDetected={(newIngs) => {
                  setIngredients(prev => Array.from(new Set([...prev, ...newIngs])));
                }} />
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {loading ? 'Finding Recipes...' : recipes.length > 0 ? 'Recipes Found' : 'Recommended'}
                </h2>
                {recipes.length > 0 && <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-bold">{recipes.length} results</span>}
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                  <p className="text-gray-500 font-medium">Mixing ingredients and checking cookbooks...</p>
                </div>
              ) : recipes.length > 0 ? (
                <div className="recipe-grid">
                  {recipes.map(recipe => (
                    <RecipeCard 
                      key={recipe.idMeal} 
                      recipe={recipe} 
                      isFavorite={!!favorites.find(f => f.idMeal === recipe.idMeal)}
                      onToggleFavorite={() => toggleFavorite(recipe)}
                      onClick={() => setSelectedRecipe(recipe)}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-orange-50 border-2 border-dashed border-orange-200 rounded-3xl py-20 px-6 text-center">
                  <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i className="fa-solid fa-magnifying-glass text-3xl text-orange-400"></i>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Ready to cook?</h3>
                  <p className="text-gray-600 max-w-md mx-auto">Add at least one ingredient above or snap a photo of your fridge to get started!</p>
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'favorites' && (
          <section>
            <h2 className="text-2xl font-bold mb-8 text-gray-800 flex items-center gap-2">
              <i className="fa-solid fa-star text-yellow-500"></i>
              Your Favorites
            </h2>
            {favorites.length > 0 ? (
              <div className="recipe-grid">
                {favorites.map(recipe => (
                  <RecipeCard 
                    key={recipe.idMeal} 
                    recipe={recipe} 
                    isFavorite={true}
                    onToggleFavorite={() => toggleFavorite(recipe)}
                    onClick={() => setSelectedRecipe(recipe)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-gray-50 rounded-3xl border border-gray-100">
                <i className="fa-regular fa-star text-5xl text-gray-300 mb-4 block"></i>
                <h3 className="text-lg font-bold text-gray-700">No favorites yet</h3>
                <p className="text-gray-500">Save recipes you love to find them easily later.</p>
              </div>
            )}
          </section>
        )}

        {activeTab === 'shopping' && (
          <section className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <i className="fa-solid fa-cart-shopping text-blue-500"></i>
                Shopping List
              </h2>
              <button 
                onClick={() => setShoppingList([])}
                className="text-sm text-red-500 font-medium hover:underline"
                disabled={shoppingList.length === 0}
              >
                Clear all
              </button>
            </div>
            {shoppingList.length > 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                {shoppingList.map((item, index) => (
                  <div 
                    key={`${item.name}-${index}`}
                    className={`flex items-center justify-between p-4 border-b last:border-0 hover:bg-gray-50 transition-colors ${item.checked ? 'bg-gray-50' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => toggleShoppingItem(index)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${item.checked ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}
                      >
                        {item.checked && <i className="fa-solid fa-check text-xs"></i>}
                      </button>
                      <div>
                        <p className={`font-semibold ${item.checked ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.measure} • For: {item.recipeName}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeShoppingItem(index)}
                      className="w-8 h-8 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition-all"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-gray-50 rounded-3xl border border-gray-100">
                <i className="fa-solid fa-basket-shopping text-5xl text-gray-300 mb-4 block"></i>
                <h3 className="text-lg font-bold text-gray-700">List is empty</h3>
                <p className="text-gray-500">Add missing ingredients from recipe views.</p>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Footer Navigation (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-2 flex justify-around items-center md:hidden z-40">
        {(['search', 'favorites', 'shopping'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${
              activeTab === tab ? 'text-orange-500' : 'text-gray-400'
            }`}
          >
            <i className={`fa-solid ${tab === 'search' ? 'fa-magnifying-glass' : tab === 'favorites' ? 'fa-star' : 'fa-cart-shopping'} text-xl`}></i>
            <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">{tab}</span>
          </button>
        ))}
      </div>

      {/* Floating Chatbot */}
      <Chatbot currentIngredients={ingredients} />

      {/* Modals */}
      {selectedRecipe && (
        <RecipeModal 
          recipe={selectedRecipe} 
          onClose={() => setSelectedRecipe(null)}
          isFavorite={!!favorites.find(f => f.idMeal === selectedRecipe.idMeal)}
          onToggleFavorite={() => toggleFavorite(selectedRecipe)}
          userIngredients={ingredients}
          onAddToShopping={addToShoppingList}
        />
      )}
    </div>
  );
};

export default App;
