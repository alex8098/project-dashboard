import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const stmt = db.prepare(`
      SELECT p.*, 
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status != 'done') as pending_tasks
      FROM projects p
      ORDER BY p.updated_at DESC
    `);
    const projects = stmt.all();
    
    const projectsWithTasks = projects.map((p: any) => {
      const taskStmt = db.prepare("SELECT * FROM tasks WHERE project_id = ?");
      return { ...p, tasks: taskStmt.all(p.id) };
    });
    
    return NextResponse.json({ projects: projectsWithTasks });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ projects: [] }, { status: 500 });
  }
}