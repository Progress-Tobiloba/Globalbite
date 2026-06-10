import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, LayoutGrid, List, X, Loader2, Globe } from 'lucide-react';
import axios from 'axios';
import RecipeGrid from './components/RecipeGrid.jsx';
import ChatWidget from './components/ChatWidget.jsx';

const SPOONACULAR_BASE = 'https://api.spoonacular.com/recipes';
const SPOONACULAR_KEY = import.meta.env.VITE_SPOONACULAR_KEY || 'demo';

const FEATURED_CUISINES = ['Italian', 'Japanese', 'Mexican', 'Indian', 'Thai', 'French'];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function App() {
  const [query, setQuery] = useState('');
  const [activeCuisine, setActiveCuisine] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [layout, setLayout] = useState('grid');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(
    async (overrideQuery, overrideCuisine) => {
      const searchQuery = overrideQuery !== undefined ? overrideQuery : query;
      const cuisine = overrideCuisine !== undefined ? overrideCuisine : activeCuisine;

      if (!searchQuery.trim() && !cuisine) return;

      setLoading(true);
      setError('');
      setHasSearched(true);

      try {
        const params = {
          apiKey: SPOONACULAR_KEY,
          number: 12,
          addRecipeInformation: true,
          fillIngredients: false,
        };

        if (searchQuery.trim()) params.query = searchQuery.trim();
        if (cuisine) params.cuisine = cuisine;

        const res = await axios.get(`${SPOONACULAR_BASE}/complexSearch`, { params });
        setRecipes(res.data.results || []);

        if ((res.data.results || []).length === 0) {
          setError('No recipes found. Try a different search or cuisine.');
        }
      } catch (err) {
        if (err.response?.status === 402) {
          setError('API limit reached. Showing demo data.');
          setRecipes(getMockRecipes(searchQuery || cuisine));
        } else {
          setError('Failed to fetch recipes. Please try again.');
        }
        console.error('[Search] Error:', err.message);
      } finally {
        setLoading(false);
      }
    },
    [query, activeCuisine]
  );

  const handleCuisineClick = (cuisine) => {
    const next = cuisine === activeCuisine ? '' : cuisine;
    setActiveCuisine(next);
    handleSearch(query, next);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleClear = () => {
    setQuery('');
    setActiveCuisine('');
    setRecipes([]);
    setError('');
    setHasSearched(false);
  };

  return (
    <div className="min-h-screen bg-cream">
      <motion.header
        className="border-b border-surface px-6 py-5 flex items-center justify-between"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center gap-3">
          <Globe className="text-accent" size={22} strokeWidth={1.5} />
          <span className="font-display font-semibold text-charcoal text-xl tracking-tight">
            GlobalBite
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLayout('grid')}
            aria-label="Grid layout"
            className={`p-2 transition-colors ${
              layout === 'grid' ? 'text-charcoal' : 'text-muted hover:text-charcoal'
            }`}
          >
            <LayoutGrid size={18} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setLayout('list')}
            aria-label="List layout"
            className={`p-2 transition-colors ${
              layout === 'list' ? 'text-charcoal' : 'text-muted hover:text-charcoal'
            }`}
          >
            <List size={18} strokeWidth={1.5} />
          </button>
        </div>
      </motion.header>

      <main className="max-w-4xl mx-auto px-6 pt-16 pb-24">
        <motion.div
          className="mb-14"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <p className="font-body text-muted text-sm uppercase tracking-widest mb-4">
            Global Recipe Finder
          </p>
          <h1 className="font-display font-bold text-charcoal text-5xl md:text-6xl leading-tight mb-10 text-balance">
            What would you like
            <br />
            <em className="text-olive not-italic">to cook today?</em>
          </h1>

          <div className="relative mb-8">
            <Search
              className="absolute left-0 top-1/2 -translate-y-1/2 text-muted"
              size={20}
              strokeWidth={1.5}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search pasta, sushi, tacos..."
              className="input-field pl-8 pr-20 text-xl"
              aria-label="Search recipes"
            />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <AnimatePresence>
                {(query || activeCuisine) && (
                  <motion.button
                    key="clear"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={handleClear}
                    className="text-muted hover:text-charcoal transition-colors"
                    aria-label="Clear search"
                  >
                    <X size={18} strokeWidth={1.5} />
                  </motion.button>
                )}
              </AnimatePresence>
              <button
                onClick={() => handleSearch()}
                disabled={loading}
                className="btn-primary py-2 px-5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
              </button>
            </div>
          </div>

          <motion.div
            className="flex flex-wrap gap-2"
            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
            initial="hidden"
            animate="visible"
          >
            {FEATURED_CUISINES.map((cuisine, i) => (
              <motion.button
                key={cuisine}
                custom={i}
                variants={fadeUp}
                onClick={() => handleCuisineClick(cuisine)}
                className={`tag cursor-pointer transition-all duration-200 ${
                  activeCuisine === cuisine
                    ? 'bg-charcoal text-cream'
                    : 'hover:bg-charcoal hover:text-cream'
                }`}
              >
                {cuisine}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 p-4 border border-error/30 bg-error/5 text-error font-body text-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {loading && (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-surface animate-pulse">
                  <div className="aspect-video bg-muted/30" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-muted/30 rounded w-3/4" />
                    <div className="h-3 bg-muted/20 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {!loading && recipes.length > 0 && (
          <>
            <motion.div
              className="flex items-center justify-between mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <p className="font-body text-muted text-sm">
                {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} found
              </p>
            </motion.div>
            <RecipeGrid recipes={recipes} layout={layout} />
          </>
        )}

        {!loading && !hasSearched && (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p className="font-display text-2xl text-muted/60 mb-2">
              Explore 5,000+ recipes worldwide
            </p>
            <p className="font-body text-muted text-sm">
              Search above, or pick a cuisine to get started.
            </p>
          </motion.div>
        )}
      </main>

      <ChatWidget />
    </div>
  );
}

function getMockRecipes(hint = '') {
  return [
    { id: 1, title: `${hint || 'Classic'} Pasta Carbonara`, image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&h=300&fit=crop', readyInMinutes: 30, servings: 4, cuisines: ['Italian'], summary: 'A rich and creamy Italian classic.' },
    { id: 2, title: 'Miso Ramen Bowl', image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop', readyInMinutes: 45, servings: 2, cuisines: ['Japanese'], summary: 'Warming Japanese ramen with a deep miso broth.' },
    { id: 3, title: 'Chicken Tikka Masala', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop', readyInMinutes: 50, servings: 4, cuisines: ['Indian'], summary: 'Tender chicken in a richly spiced tomato cream sauce.' },
    { id: 4, title: 'Beef Tacos al Pastor', image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&h=300&fit=crop', readyInMinutes: 35, servings: 3, cuisines: ['Mexican'], summary: 'Smoky marinated beef with pineapple salsa.' },
    { id: 5, title: 'Pad Thai', image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&h=300&fit=crop', readyInMinutes: 25, servings: 2, cuisines: ['Thai'], summary: 'Classic Thai stir-fried noodles with shrimp and peanuts.' },
    { id: 6, title: 'French Onion Soup', image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop', readyInMinutes: 60, servings: 4, cuisines: ['French'], summary: 'Deeply caramelised onion soup with a Gruyère crouton crown.' },
  ];
}
