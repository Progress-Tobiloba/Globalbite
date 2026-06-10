import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Users, ExternalLink, Loader2, CheckCircle2 } from 'lucide-react';

const SPOONACULAR_KEY = import.meta.env.VITE_SPOONACULAR_KEY || 'demo';

export default function RecipeModal({ recipe, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!recipe) return;

    const fetchDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(
          `https://api.spoonacular.com/recipes/${recipe.id}/information?apiKey=${SPOONACULAR_KEY}&includeNutrition=false`
        );
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        setDetails(data);
      } catch (err) {
        console.error('[RecipeModal] Fetch error:', err.message);
        setError('Could not load recipe details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [recipe]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Strip HTML tags from summary
  const stripHtml = (html) => html?.replace(/<[^>]*>/g, '') || '';

  const instructions = details?.analyzedInstructions?.[0]?.steps || [];
  const ingredients = details?.extendedIngredients || [];

  return (
    <AnimatePresence>
      {recipe && (
        <>
          {/* ── Backdrop ─────────────────────────────────────────────── */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-charcoal/50"
            style={{ backdropFilter: 'blur(4px)' }}
          />

          {/* ── Modal Panel ──────────────────────────────────────────── */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-cream max-h-[90vh] overflow-y-auto"
            style={{ borderRadius: '16px 16px 0 0' }}
          >
            {/* ── Header Image ─────────────────────────────────────── */}
            <div className="relative">
              {recipe.image ? (
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="w-full h-52 object-cover"
                />
              ) : (
                <div className="w-full h-52 bg-surface flex items-center justify-center">
                  <span className="text-6xl">🍽️</span>
                </div>
              )}

              {/* Close button */}
              <motion.button
                onClick={onClose}
                whileTap={{ scale: 0.88 }}
                className="absolute top-4 right-4 w-8 h-8 bg-charcoal/70 text-cream flex items-center justify-center rounded-full"
                aria-label="Close"
              >
                <X size={16} strokeWidth={1.5} />
              </motion.button>

              {/* Drag handle */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/50 rounded-full" />
            </div>

            {/* ── Content ──────────────────────────────────────────── */}
            <div className="px-5 py-6">
              <h2 className="font-display font-bold text-charcoal text-2xl leading-tight mb-3">
                {recipe.title}
              </h2>

              {/* Meta */}
              <div className="flex items-center gap-4 text-muted text-sm font-body mb-5">
                {recipe.readyInMinutes > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} strokeWidth={1.5} />
                    {recipe.readyInMinutes} min
                  </span>
                )}
                {recipe.servings > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Users size={14} strokeWidth={1.5} />
                    {recipe.servings} servings
                  </span>
                )}
              </div>

              {/* Loading */}
              {loading && (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={28} className="animate-spin text-olive" strokeWidth={1.5} />
                </div>
              )}

              {/* Error */}
              {!loading && error && (
                <p className="text-error text-sm font-body py-8 text-center">{error}</p>
              )}

              {/* Details */}
              {!loading && details && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Summary */}
                  {details.summary && (
                    <p className="font-body text-muted text-sm leading-relaxed mb-6 line-clamp-3">
                      {stripHtml(details.summary)}
                    </p>
                  )}

                  {/* Ingredients */}
                  {ingredients.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-display font-semibold text-charcoal text-lg mb-3">
                        Ingredients
                      </h3>
                      <ul className="space-y-2">
                        {ingredients.map((ing, i) => (
                          <motion.li
                            key={ing.id || i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="flex items-start gap-2 font-body text-sm text-charcoal"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                            <span>
                              <span className="font-medium">
                                {ing.amount} {ing.unit}
                              </span>{' '}
                              {ing.name}
                            </span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Instructions */}
                  {instructions.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-display font-semibold text-charcoal text-lg mb-3">
                        Instructions
                      </h3>
                      <ol className="space-y-4">
                        {instructions.map((step, i) => (
                          <motion.li
                            key={step.number || i}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="flex items-start gap-3"
                          >
                            <span className="w-6 h-6 rounded-full bg-charcoal text-cream text-xs font-body font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                              {step.number}
                            </span>
                            <p className="font-body text-sm text-charcoal leading-relaxed">
                              {step.step}
                            </p>
                          </motion.li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* No instructions fallback */}
                  {instructions.length === 0 && !loading && (
                    <div className="flex items-center gap-2 text-muted text-sm font-body mb-6">
                      <CheckCircle2 size={14} strokeWidth={1.5} />
                      <span>No step-by-step instructions available for this recipe.</span>
                    </div>
                  )}

                  {/* Source link */}
                  {details.sourceUrl && (
                    <a
                      href={details.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 font-body text-sm text-olive hover:text-charcoal transition-colors border-b border-olive/30 pb-0.5"
                    >
                      View full recipe
                      <ExternalLink size={12} strokeWidth={1.5} />
                    </a>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
