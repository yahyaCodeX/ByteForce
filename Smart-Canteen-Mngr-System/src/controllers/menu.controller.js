// src/controllers/menu.controller.js
// Step 1-2 of the 20-step workflow:
//   1. Customer opens the menu.
//   2. System shows only currently available items.

import pool from '../db/pool.js';
import { getNextAvailableSlots, restockItem } from '../services/stock-limits.service.js';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/menu
// Public — Returns all AVAILABLE and LIMITED items with optional filters
// Query params: category, minPrice, maxPrice, maxPrepTime, sort, search
// ─────────────────────────────────────────────────────────────────────────────
export async function getMenu(req, res) {
  try {
    const { category, minPrice, maxPrice, maxPrepTime, sort = 'category', search } = req.query;

    let conditions = [`status IN ('AVAILABLE', 'LIMITED')`];
    const params = [];
    let idx = 1;

    if (category) {
      conditions.push(`LOWER(category) = LOWER($${idx++})`);
      params.push(category);
    }
    if (minPrice) {
      conditions.push(`price >= $${idx++}`);
      params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      conditions.push(`price <= $${idx++}`);
      params.push(parseFloat(maxPrice));
    }
    if (maxPrepTime) {
      conditions.push(`preparation_time <= $${idx++}`);
      params.push(parseInt(maxPrepTime, 10));
    }
    if (search) {
      conditions.push(`(LOWER(item_name) LIKE LOWER($${idx++}) OR LOWER(description) LIKE LOWER($${idx - 1}))`);
      params.push(`%${search}%`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const sortOptions = {
      category:        'category ASC, item_name ASC',
      price_asc:       'price ASC',
      price_desc:      'price DESC',
      prep_time:       'preparation_time ASC',
      popularity:      'available_quantity DESC',
    };
    const orderBy = sortOptions[sort] || sortOptions.category;

    const { rows } = await pool.query(
      `SELECT
         item_id, item_name, category, price,
         available_quantity, preparation_time, status, image, description
       FROM menu_items
       ${whereClause}
       ORDER BY ${orderBy}`,
      params
    );

    // Group items by category for frontend convenience
    const byCategory = rows.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});

    const categories = [...new Set(rows.map((r) => r.category))];

    return res.json({
      success: true,
      total: rows.length,
      categories,
      items: rows,
      byCategory,
    });
  } catch (err) {
    console.error('getMenu error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to load menu.' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/menu/:itemId
// Returns a single menu item detail
// ─────────────────────────────────────────────────────────────────────────────
export async function getMenuItem(req, res) {
  try {
    const { itemId } = req.params;
    const { rows } = await pool.query(
      `SELECT item_id, item_name, category, price,
              available_quantity, preparation_time, status, image, description
       FROM menu_items WHERE item_id = $1`,
      [itemId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Item not found.' });
    }
    return res.json({ success: true, item: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to load item.' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/menu/slots
// Returns available pickup slots with remaining capacity
// ─────────────────────────────────────────────────────────────────────────────
export async function getPickupSlots(req, res) {
  try {
    const slots = await getNextAvailableSlots(new Date(), pool, 16);
    return res.json({ success: true, slots });
  } catch (err) {
    console.error('getPickupSlots error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to load pickup slots.' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/menu/:itemId/status  (STAFF / MANAGER only)
// Toggle item availability
// ─────────────────────────────────────────────────────────────────────────────
export async function updateItemStatus(req, res) {
  try {
    const { itemId } = req.params;
    const { status, available_quantity } = req.body;

    const validStatuses = ['AVAILABLE', 'LIMITED', 'SOLD_OUT', 'TEMPORARILY_UNAVAILABLE'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    let updatedItem;
    if (available_quantity !== undefined) {
      // If quantity is provided, use restockItem which auto-calculates status if overrideStatus is not provided
      updatedItem = await restockItem(itemId, parseInt(available_quantity, 10), status, pool);
    } else {
      // Just update status
      const { rows } = await pool.query(
        `UPDATE menu_items SET status = $1, updated_at = NOW()
         WHERE item_id = $2
         RETURNING item_id, item_name, status, available_quantity`,
        [status, itemId]
      );
      updatedItem = rows[0];
    }

    if (!updatedItem) {
      return res.status(404).json({ success: false, error: 'Item not found.' });
    }

    // Log staff action
    await pool.query(
      `INSERT INTO staff_activity_logs (staff_id, action, entity, entity_id, details)
       VALUES ($1, 'UPDATE_ITEM_STATUS', 'menu_items', $2, $3)`,
      [req.user.user_id, itemId, JSON.stringify({ status, available_quantity })]
    );

    return res.json({ success: true, item: updatedItem });
  } catch (err) {
    console.error('updateItemStatus error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to update item status.' });
  }
}
