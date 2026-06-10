import mongoose from 'mongoose';

const RecipeSchema = new mongoose.Schema(
  {
    externalId: {
      type: String,
      required: [true, 'External recipe ID is required.'],
      unique: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Recipe title is required.'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters.'],
    },
    image: {
      type: String,
      trim: true,
      default: '',
    },
    cuisine: {
      type: String,
      trim: true,
      default: 'Unknown',
      index: true,
    },
    readyInMinutes: {
      type: Number,
      min: [0, 'Cook time cannot be negative.'],
      default: 0,
    },
    servings: {
      type: Number,
      min: [1, 'Servings must be at least 1.'],
      default: 1,
    },
    sourceUrl: {
      type: String,
      trim: true,
      default: '',
    },
    summary: {
      type: String,
      trim: true,
      default: '',
    },
    savedBy: {
      type: String,
      trim: true,
      default: 'anonymous',
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

RecipeSchema.index({ title: 'text', cuisine: 'text' });
RecipeSchema.index({ createdAt: -1 });

const Recipe = mongoose.model('Recipe', RecipeSchema);

export default Recipe;
