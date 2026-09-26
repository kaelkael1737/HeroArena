import { recipes, smeltingRecipes } from '../config'
import type { EquipmentItem, RecipeIngredient } from '../types'

export type ResourceStock = Record<string, number>

function hasIngredients(stock: ResourceStock, ingredients: RecipeIngredient[]): boolean {
  return ingredients.every((ing) => (stock[ing.resourceId] ?? 0) >= ing.quantity)
}

function consumeIngredients(stock: ResourceStock, ingredients: RecipeIngredient[]): ResourceStock {
  const next = { ...stock }
  for (const ing of ingredients) {
    next[ing.resourceId] = (next[ing.resourceId] ?? 0) - ing.quantity
  }
  return next
}

export function canCraft(stock: ResourceStock, recipeId: string): boolean {
  const recipe = recipes.find((r) => r.id === recipeId)
  if (!recipe) return false
  return hasIngredients(stock, recipe.ingredients)
}

export interface CraftResult {
  stock: ResourceStock
  item: EquipmentItem
}

export function craft(
  stock: ResourceStock,
  recipeId: string,
  idFactory: () => string = () => crypto.randomUUID(),
): CraftResult {
  const recipe = recipes.find((r) => r.id === recipeId)
  if (!recipe) throw new Error(`Recette inconnue : ${recipeId}`)
  if (!hasIngredients(stock, recipe.ingredients)) {
    throw new Error(`Ingrédients insuffisants pour : ${recipe.name}`)
  }
  return {
    stock: consumeIngredients(stock, recipe.ingredients),
    item: { instanceId: idFactory(), recipeId: recipe.id, level: 1 },
  }
}

export function canSmelt(stock: ResourceStock, smeltingRecipeId: string): boolean {
  const recipe = smeltingRecipes.find((r) => r.id === smeltingRecipeId)
  if (!recipe) return false
  return (stock[recipe.input.resourceId] ?? 0) >= recipe.input.quantity
}

export function smelt(stock: ResourceStock, smeltingRecipeId: string): ResourceStock {
  const recipe = smeltingRecipes.find((r) => r.id === smeltingRecipeId)
  if (!recipe) throw new Error(`Recette de fonte inconnue : ${smeltingRecipeId}`)
  if ((stock[recipe.input.resourceId] ?? 0) < recipe.input.quantity) {
    throw new Error(`Ressources insuffisantes pour : ${recipe.name}`)
  }
  const next = { ...stock }
  next[recipe.input.resourceId] -= recipe.input.quantity
  next[recipe.output.resourceId] = (next[recipe.output.resourceId] ?? 0) + recipe.output.quantity
  return next
}
