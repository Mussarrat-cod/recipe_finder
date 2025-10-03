// API Configuration
const API_KEY = '89d7a0a34d10457cacefe4342f256294'; // Spoonacular API key (no trailing space)
const API_URL = 'https://api.spoonacular.com/recipes/findByIngredients';
const RECIPE_INFO_URL = 'https://api.spoonacular.com/recipes/{id}/information';

// DOM Elements
const searchBtn = document.getElementById('searchBtn');
const ingredientInput = document.getElementById('ingredientInput');
const resultsContainer = document.getElementById('results');
const loadingElement = document.getElementById('loading');
const errorElement = document.getElementById('error');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    searchBtn.addEventListener('click', searchRecipes);
    ingredientInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchRecipes();
        }
    });
});

// Main function to search for recipes
async function searchRecipes() {
    const ingredients = ingredientInput.value.trim();
    
    if (!ingredients) {
        showError('Please enter at least one ingredient');
        return;
    }

    // Show loading state
    showLoading(true);
    clearResults();
    
    try {
        // Format ingredients for the API
        const ingredientsList = ingredients.split(',').map(ing => ing.trim()).filter(Boolean);
        
        // Make API request to find recipes by ingredients
        const recipes = await fetchRecipesByIngredients(ingredientsList);
        
        if (recipes.length === 0) {
            showError('No recipes found. Try different ingredients.');
            return;
        }
        
        // Get detailed information for each recipe
        const detailedRecipes = await Promise.all(
            recipes.map(recipe => getRecipeDetails(recipe.id))
        );
        
        // Display the recipes
        displayRecipes(detailedRecipes);
        
    } catch (error) {
        console.error('Error fetching recipes:', error);
        showError('Failed to fetch recipes. Please try again later.');
    } finally {
        showLoading(false);
    }
}

// Fetch recipes by ingredients
async function fetchRecipesByIngredients(ingredients) {
    const params = new URLSearchParams({
        apiKey: API_KEY,
        ingredients: ingredients.join(','),
        number: 12, // Limit to 12 recipes
        ranking: 2, // Maximize used ingredients
        ignorePantry: true,
    });
    
    const response = await fetch(`${API_URL}?${params}`);
    
    if (!response.ok) {
        throw new Error('Failed to fetch recipes');
    }
    
    return await response.json();
}

// Get detailed information for a specific recipe
async function getRecipeDetails(recipeId) {
    const params = new URLSearchParams({
        apiKey: API_KEY,
        includeNutrition: true,
    });
    
    const response = await fetch(`${RECIPE_INFO_URL.replace('{id}', recipeId)}?${params}`);
    
    if (!response.ok) {
        console.error(`Failed to fetch details for recipe ${recipeId}`);
        return null;
    }
    
    return await response.json();
}

// Display recipes in the UI
function displayRecipes(recipes) {
    clearResults();
    
    const validRecipes = recipes.filter(recipe => recipe !== null);
    
    if (validRecipes.length === 0) {
        showError('No recipes found. Try different ingredients.');
        return;
    }
    
    validRecipes.forEach(recipe => {
        const recipeCard = createRecipeCard(recipe);
        resultsContainer.appendChild(recipeCard);
    });
}

// Create a recipe card element
function createRecipeCard(recipe) {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    
    // Get recipe image or use a placeholder
    const imageUrl = recipe.image || 'https://via.placeholder.com/300x200?text=No+Image+Available';
    
    // Get nutrition info
    const nutrition = recipe.nutrition;
    const healthBenefits = getHealthBenefits(recipe);
    
    card.innerHTML = `
        <img src="${imageUrl}" alt="${recipe.title}" class="recipe-img">
        <div class="recipe-info">
            <h3 class="recipe-title">${recipe.title}</h3>
            <div class="recipe-meta">
                <span>⏱️ ${recipe.readyInMinutes} min</span>
                <span>👥 Serves ${recipe.servings || 'N/A'}</span>
            </div>
            ${healthBenefits ? `
            <div class="recipe-benefits">
                <h4>Health Benefits</h4>
                <p>${healthBenefits}</p>
            </div>` : ''}
            <button class="view-recipe" data-id="${recipe.id}">View Recipe</button>
        </div>
    `;
    
    // Add click event to view full recipe
    card.querySelector('.view-recipe').addEventListener('click', () => {
        window.open(recipe.sourceUrl || `https://spoonacular.com/recipes/${recipe.title.toLowerCase().replace(/\s+/g, '-')}-${recipe.id}`, '_blank');
    });
    
    return card;
}

// Generate health benefits based on nutrition data
function getHealthBenefits(recipe) {
    if (!recipe.nutrition) return '';
    
    const benefits = [];
    const nutrients = recipe.nutrition.nutrients;
    
    // Check for protein content
    const protein = nutrients.find(n => n.name === 'Protein');
    if (protein && protein.amount > 15) {
        benefits.push('High in protein');
    }
    
    // Check for fiber content
    const fiber = nutrients.find(n => n.name === 'Fiber');
    if (fiber && fiber.amount > 5) {
        benefits.push('High in fiber');
    }
    
    // Check for low calories
    const calories = nutrients.find(n => n.name === 'Calories');
    if (calories && calories.amount < 400) {
        benefits.push('Low calorie');
    }
    
    // Check for vitamins
    const vitA = nutrients.find(n => n.name === 'Vitamin A');
    const vitC = nutrients.find(n => n.name === 'Vitamin C');
    const calcium = nutrients.find(n => n.name === 'Calcium');
    const iron = nutrients.find(n => n.name === 'Iron');
    
    if (vitA && vitA.percentOfDailyNeeds > 20) benefits.push('Rich in Vitamin A');
    if (vitC && vitC.percentOfDailyNeeds > 20) benefits.push('Rich in Vitamin C');
    if (calcium && calcium.percentOfDailyNeeds > 20) benefits.push('Good source of Calcium');
    if (iron && iron.percentOfDailyNeeds > 15) benefits.push('Good source of Iron');
    
    // Check for dietary restrictions
    if (recipe.vegetarian) benefits.push('Vegetarian');
    if (recipe.vegan) benefits.push('Vegan');
    if (recipe.glutenFree) benefits.push('Gluten Free');
    if (recipe.dairyFree) benefits.push('Dairy Free');
    
    return benefits.length > 0 ? benefits.join(' • ') : 'No specific health benefits data available';
}

// Helper functions
function showLoading(show) {
    loadingElement.style.display = show ? 'flex' : 'none';
}

function showError(message) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function clearResults() {
    resultsContainer.innerHTML = '';
    errorElement.style.display = 'none';
}

// Get health benefits for a recipe (placeholder - can be expanded)
function getHealthBenefits(recipe) {
    const benefits = [];
    if (recipe.vegetarian) benefits.push('Vegetarian');
    if (recipe.vegan) benefits.push('Vegan');
    if (recipe.glutenFree) benefits.push('Gluten Free');
    return benefits.length > 0 ? benefits.join(' • ') : null;
}
