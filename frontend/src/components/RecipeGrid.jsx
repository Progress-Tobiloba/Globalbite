import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RecipeCard from './RecipeCard.jsx';
import RecipeModal from './RecipeModal.jsx';
import api from '../api.js';

const gridContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

export default function RecipeGrid({ recipes, layout }) {
  const [savedIds, setSavedIds] = useState(new Set());
  const [savingId, setSavingId] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const handleSave = useCallback(
    async (recipe) => {
      if (savingId) return;
      const alreadySaved = savedIds.has(recipe.id);

      setSavingId(recipe.id);
      setSaveError('');

      try {
        if (alreadySaved) {
          setSavedIds((prev) => {
            const next = new Set(prev);
            next.delete(recipe.id);
            return next;
          });
        } else {
          await api.post('/recipes', {
            externalId: String(recipe.id),
            title: recipe.title,
            image: recipe.image || '',
            cuisine: recipe.cuisines?.[0] || recipe.cuisine || 'Unknown',
            readyInMinutes: recipe.readyInMinutes || 0,
            servings: recipe.servings || 1,
            sourceUrl: recipe.sourceUrl || '',
            summary: recipe.summary || '',
          });

          setSavedIds((prev) => {
            const next = new Set(prev);
            next.add(recipe.id);
            return next;
          });
        }
      } catch (err) {
        if (err.response?.status === 409) {
          setSavedIds((prev) => {
            const next = new Set(prev);
            next.add(recipe.id);
            return next;
          });
        } else {
          setSaveError('Could not save recipe. Please try again.');
          console.error('[RecipeGrid] Save error:', err.message);
        }
      } finally {
        setSavingId(null);
      }
    },
    [savedIds, savingId]
  );

  return (
    <div>
      {/* Save error toast */}
      <AnimatePresence>
        {saveError && (
          <motion.p
            key="save-error"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 text-error text-sm font-body"
          >
            {saveError}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.div
        key={`${layout}-${recipes.length}`}
        variants={gridContainerVariants}
        initial="hidden"
        animate="visible"
        className={
          layout === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'flex flex-col gap-4'
        }
      >
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            layout={layout}
            onSave={handleSave}
            isSaved={savedIds.has(recipe.id)}
            onClick={() => setSelectedRecipe(recipe)}
          />
        ))}
      </motion.div>

      {/* Recipe Detail Modal */}
      <RecipeModal
        recipe={selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
      />
    </div>
  );
}
