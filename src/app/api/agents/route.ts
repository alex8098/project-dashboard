import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/agents - List all agents
export async function GET() {
  try {
    const agents = db.prepare(`
      SELECT a.*, 
        (SELECT COUNT(*) FROM tasks WHERE assigned_to = a.id AND status != 'completed') as active_tasks,
        (SELECT COUNT(*) FROM reports WHERE agent_id = a.id AND status = 'unread') as unread_reports
      FROM agents a
      ORDER BY a.last_ping DESC
    `).all();
    
    return NextResponse.json({ agents });
  } catch (error: any) {
    console.error("Error fetching agents:", error);
    return NextResponse.json({ agents: [], error: error.message }, { status: 500 });
  }
}

// POST /api/agents - Spawn a new agent
export async function POST(request: Request) {
  try {
    const { name, task, model } = await request.json();
    
    const agentId = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Insert agent record
    db.prepare(`
      INSERT INTO agents (id, name, status, current_task, model)
      VALUES (?, ?, 'idle', ?, ?)
    `).run(agentId, name, task || null, model || 'default');
    
    // Create initial task if provided
    if (task) {
      const taskId = `task-${Date.now()}`;
      db.prepare(`
        INSERT INTO tasks (id, title, status, assigned_to, priority)
        VALUES (?, ?, 'in-progress', ?, 'high')
      `).run(taskId, task, agentId);
      
      // Update agent status
      db.prepare(`UPDATE agents SET status = 'working' WHERE id = ?`).run(agentId);
    }
    
    return NextResponse.json({ 
      success: true, 
      agent: { id: agentId, name, status: task ? 'working' : 'idle' }
    });
  } catch (error: any) {
    console.error("Error spawning agent:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/agents?id=xxx - Kill an agent
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: "Agent ID required" }, { status: 400 });
    }
    
    db.prepare("UPDATE agents SET status = 'terminated' WHERE id = ?").run(id);
    db.prepare("UPDATE tasks SET assigned_to = NULL WHERE assigned_to = ? AND status != 'completed'").run(id);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}