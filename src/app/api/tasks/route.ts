import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/tasks - List tasks
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const agentId = searchParams.get('agent');
    
    let query = `
      SELECT t.*, a.name as assigned_name
      FROM tasks t
      LEFT JOIN agents a ON t.assigned_to = a.id
    `;
    
    const conditions = [];
    if (status) conditions.push(`t.status = '${status}'`);
    if (agentId) conditions.push(`t.assigned_to = '${agentId}'`);
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY 
      CASE t.priority 
        WHEN 'critical' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        ELSE 4 
      END,
      t.created_at DESC
    `;
    
    const tasks = db.prepare(query).all();
    
    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ tasks: [], error: error.message }, { status: 500 });
  }
}

// POST /api/tasks - Create new task
export async function POST(request: Request) {
  try {
    const { title, description, priority, assigned_to, project_id } = await request.json();
    
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    db.prepare(`
      INSERT INTO tasks (id, title, description, priority, assigned_to, project_id, status)
      VALUES (?, ?, ?, ?, ?, ?, 'backlog')
    `).run(taskId, title, description || '', priority || 'medium', assigned_to || null, project_id || null);
    
    return NextResponse.json({ success: true, task: { id: taskId, title } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/tasks - Update task status
export async function PATCH(request: Request) {
  try {
    const { id, status, assigned_to } = await request.json();
    
    const updates = [];
    const values = [];
    
    if (status) {
      updates.push('status = ?');
      values.push(status);
      
      if (status === 'in-progress') {
        updates.push('started_at = CURRENT_TIMESTAMP');
      } else if (status === 'completed') {
        updates.push('completed_at = CURRENT_TIMESTAMP');
      }
    }
    
    if (assigned_to !== undefined) {
      updates.push('assigned_to = ?');
      values.push(assigned_to);
    }
    
    values.push(id);
    
    db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}