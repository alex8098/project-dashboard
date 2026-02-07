import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/reports - Get all reports (optionally filter by agent or status)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const agentId = searchParams.get('agent');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    let query = `
      SELECT r.*, a.name as agent_name, t.title as task_title
      FROM reports r
      LEFT JOIN agents a ON r.agent_id = a.id
      LEFT JOIN tasks t ON r.task_id = t.id
    `;
    
    const conditions = [];
    if (status) conditions.push(`r.status = '${status}'`);
    if (agentId) conditions.push(`r.agent_id = '${agentId}'`);
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY r.created_at DESC LIMIT ${limit}`;
    
    const reports = db.prepare(query).all();
    
    return NextResponse.json({ reports });
  } catch (error: any) {
    console.error("Error fetching reports:", error);
    return NextResponse.json({ reports: [], error: error.message }, { status: 500 });
  }
}

// POST /api/reports - Agents submit reports (called by agents)
export async function POST(request: Request) {
  try {
    const { agent_id, task_id, type, title, content } = await request.json();
    
    // Validate required fields
    if (!agent_id || !type || !title) {
      return NextResponse.json(
        { error: "Missing required fields: agent_id, type, title" },
        { status: 400 }
      );
    }
    
    const reportId = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    db.prepare(`
      INSERT INTO reports (id, agent_id, task_id, type, title, content, status)
      VALUES (?, ?, ?, ?, ?, ?, 'unread')
    `).run(reportId, agent_id, task_id || null, type, title, content || '');
    
    // Log this report
    db.prepare(`
      INSERT INTO agent_logs (agent_id, task_id, level, message)
      VALUES (?, ?, 'info', ?)
    `).run(agent_id, task_id || null, `Submitted report: ${title}`);
    
    // Update task status if report indicates completion
    if (type === 'completion' && task_id) {
      db.prepare(`UPDATE tasks SET status = 'review' WHERE id = ?`).run(task_id);
    }
    
    return NextResponse.json({ 
      success: true, 
      report: { id: reportId, title, type }
    });
  } catch (error: any) {
    console.error("Error creating report:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/reports - Mark report as read/reviewed
export async function PATCH(request: Request) {
  try {
    const { id, status } = await request.json();
    
    if (!id || !status) {
      return NextResponse.json(
        { error: "Missing id or status" },
        { status: 400 }
      );
    }
    
    db.prepare(`UPDATE reports SET status = ? WHERE id = ?`).run(status, id);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}