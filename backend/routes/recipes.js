import { Router } from 'express';
import Recipe from '../models/Recipe.js';

const router = Router();

// ─── GET /api/recipes — fetch all saved recipes ────────────────────────────
router.get('/', async (_req, res) => {
  try {
    const recipes = await Recipe.find().sort({ createdAt: -1 }).limit(50);
    res.status(200).json({ success: true, count: recipes.length, data: recipes });
  } catch (err) {
    console.error('[Recipes GET] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to retrieve saved recipes.' });
  }
});

// ─── POST /api/recipes — save a new favourite recipe ──────────────────────
router.post('/', async (req, res) => {
  const { externalId, title, image, cuisine, readyInMinutes, servings, sourceUrl, summary } = req.body;

  if (!externalId || !title) {
    return res.status(400).json({ success: false, error: 'externalId and title are required.' });
  }

  try {
    const existing = await Recipe.findOne({ externalId });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Recipe is already saved.' });
    }

    const recipe = await Recipe.create({
      externalId,
      title,
      image: image || '',
      cuisine: cuisine || 'Unknown',
      readyInMinutes: readyInMinutes || 0,
      servings: servings || 1,
      sourceUrl: sourceUrl || '',
      summary: summary || '',
    });

    res.status(201).json({ success: true, data: recipe });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, error: messages.join(', ') });
    }
    console.error('[Recipes POST] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to save recipe.' });
  }
});

// ─── DELETE /api/recipes/:id — remove a saved recipe ──────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Recipe.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Recipe not found.' });
    }
    res.status(200).json({ success: true, message: 'Recipe removed from favourites.' });
  } catch (err) {
    console.error('[Recipes DELETE] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to delete recipe.' });
  }
});

export default router;
