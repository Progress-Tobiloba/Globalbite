import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, Bookmark } from 'lucide-react';

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function RecipeCard({ recipe, layout, onSave, isSaved, onClick }) {
  const isList = layout === 'list';

  const cuisine =
    recipe.cuisines?.length > 0
      ? recipe.cuisines[0]
      : recipe.cuisine || 'Global';

  return (
    <motion.article
      layoutId={`recipe-${recipe.id}`}
      variants={cardVariants}
      onClick={onClick}
      whileHover={{
        scale: 1.025,
        boxShadow: '0 12px 40px rgba(28, 28, 30, 0.12)',
        transition: { type: 'spring', stiffness: 320, damping: 24 },
      }}
      className={`bg-white overflow-hidden cursor-pointer group ${
        isList ? 'flex flex-row' : 'flex flex-col'
      }`}
      style={{ willChange: 'transform' }}
    >
      {/* ── Image ──────────────────────────────────────────────────── */}
      <div
        className={`relative overflow-hidden bg-surface flex-shrink-0 ${
          isList ? 'w-40 h-36' : 'aspect-video w-full'
        }`}
      >
        {recipe.image ? (
          <motion.img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.06 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted/40">
            <span className="text-4xl">🍽️</span>
          </div>
        )}

        {/* Cuisine tag overlay */}
        <span className="absolute top-2 left-2 bg-charcoal/80 text-cream text-xs font-body font-medium px-2 py-0.5">
          {cuisine}
        </span>
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="font-display font-semibold text-charcoal text-base leading-snug mb-2 line-clamp-2 group-hover:text-olive transition-colors duration-200">
          {recipe.title}
        </h3>

        {/* Meta row */}
        <div className="flex items-center gap-4 text-muted text-xs font-body mt-auto pt-3 border-t border-surface">
          {recipe.readyInMinutes > 0 && (
            <span className="flex items-center gap-1">
              <Clock size={12} strokeWidth={1.5} />
              {recipe.readyInMinutes} min
            </span>
          )}
          {recipe.servings > 0 && (
            <span className="flex items-center gap-1">
              <Users size={12} strokeWidth={1.5} />
              {recipe.servings} servings
            </span>
          )}

          {/* Save button */}
          <motion.button
            onClick={(e) => { e.stopPropagation(); onSave && onSave(recipe); }}
            aria-label={isSaved ? 'Unsave recipe' : 'Save recipe'}
            className={`ml-auto transition-colors duration-200 ${
              isSaved ? 'text-accent' : 'text-muted hover:text-charcoal'
            }`}
            whileTap={{ scale: 0.85 }}
          >
            <Bookmark
              size={14}
              strokeWidth={1.5}
              fill={isSaved ? 'currentColor' : 'none'}
            />
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
