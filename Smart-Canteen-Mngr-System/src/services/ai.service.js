// src/services/ai.service.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import pool from '../db/pool.js';

let genAI = null;

function getAIClient() {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

/**
 * Generates comprehensive AI insights based on canteen data
 */
export async function generateAIInsights() {
  const client = getAIClient();
  if (!client) {
    return {
      success: false,
      error: 'AI Features are not enabled. Please configure GEMINI_API_KEY.'
    };
  }

  try {
    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // 1. Fetch live contextual data for the AI to analyze
    
    // Order stats today
    const { rows: orderStats } = await pool.query(`
      SELECT order_status, COUNT(*) as count 
      FROM orders 
      WHERE order_time::date = CURRENT_DATE
      GROUP BY order_status
    `);

    // Sales by item (last 7 days to give trend data)
    const { rows: itemTrends } = await pool.query(`
      SELECT m.item_name, m.category, SUM(oi.quantity) as total_sold, m.available_quantity, m.status
      FROM order_items oi
      JOIN menu_items m ON oi.item_id = m.item_id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.order_time >= NOW() - INTERVAL '7 days'
        AND o.order_status != 'CANCELLED'
      GROUP BY m.item_name, m.category, m.available_quantity, m.status
      ORDER BY total_sold DESC
    `);

    // Peak hours (last 7 days)
    const { rows: peakHours } = await pool.query(`
      SELECT EXTRACT(HOUR FROM order_time) as hour, COUNT(*) as order_count
      FROM orders
      WHERE order_time >= NOW() - INTERVAL '7 days'
      GROUP BY hour
      ORDER BY order_count DESC
      LIMIT 3
    `);

    // Build the prompt context
    const dataContext = `
      CURRENT CANTEEN STATUS & TRENDS:
      - Current Time: ${new Date().toLocaleTimeString()}
      
      Today's Orders Summary:
      ${JSON.stringify(orderStats, null, 2)}
      
      7-Day Item Trends & Current Stock:
      ${JSON.stringify(itemTrends.slice(0, 15), null, 2)}
      
      Busiest Hours (Last 7 Days):
      ${JSON.stringify(peakHours, null, 2)}
    `;

    const prompt = `
      You are an expert AI Canteen Management Assistant. Analyze the provided operational data and generate intelligent insights.
      
      Data Context:
      ${dataContext}
      
      Respond STRICTLY in the following JSON structure without any markdown formatting or extra text.
      {
        "food_demand_prediction": "Predict which food items will have high demand today based on the trends.",
        "peak_time_prediction": "Estimate when the canteen will be busiest today.",
        "preparation_forecasting": "Suggest how many portions of the top 3 items should be pre-prepared right now.",
        "smart_recommendation": "Suggest 2 items to highlight/promote to customers right now (perhaps high stock, low sales, or combo pairings).",
        "food_waste_prediction": "Identify items that might go to waste (high stock, low sales).",
        "order_delay_prediction": "Assess current kitchen workload (from Today's Orders Summary) and predict if delays are likely.",
        "sales_insights": "Generate a 1-sentence management insight summary (e.g. 'Burger sales spiked during 1 PM')."
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    // Clean up markdown if the AI mistakenly wrapped it
    const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return {
      success: true,
      insights: JSON.parse(jsonStr),
      timestamp: new Date()
    };
  } catch (error) {
    console.error('AI Insight Generation Failed:', error);
    return { success: false, error: 'Failed to generate AI insights.' };
  }
}

/**
 * Generates Smart Customer Food Recommendations for the ordering menu
 */
export async function getCustomerRecommendations(customerId = null) {
  const client = getAIClient();
  if (!client) return { success: false, error: 'AI Disabled' };

  try {
    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Fetch active menu items
    const { rows: menuItems } = await pool.query(`
      SELECT item_id, item_name, category, price, available_quantity 
      FROM menu_items 
      WHERE status IN ('AVAILABLE', 'LIMITED')
    `);

    const prompt = `
      You are a Smart Food Recommendation Engine for a college canteen.
      Available Menu Items:
      ${JSON.stringify(menuItems, null, 2)}
      
      Based on this list, recommend 3 items for a student right now. 
      Consider items that make a good combo (e.g., Burger + Drink) or quick snacks.
      
      Respond STRICTLY in this JSON format:
      [
        {
          "item_id": "UUID_HERE",
          "item_name": "Name",
          "reason": "Short catchy reason why (e.g., 'Perfect quick bite!')"
        }
      ]
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return { success: true, recommendations: JSON.parse(jsonStr) };
  } catch (err) {
    return { success: false, error: 'AI Recommendation failed' };
  }
}
