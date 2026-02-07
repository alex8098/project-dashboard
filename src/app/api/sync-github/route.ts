import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export async function POST() {
  try {
    if (!GITHUB_TOKEN) {
      return NextResponse.json(
        { error: "GITHUB_TOKEN not configured" },
        { status: 500 }
      );
    }

    const reposRes = await fetch("https://api.github.com/user/repos?per_page=100", {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    
    if (!reposRes.ok) {
      const errorText = await reposRes.text();
      console.error("GitHub API error:", errorText);
      return NextResponse.json(
        { error: `GitHub API error: ${reposRes.status}` },
        { status: 500 }
      );
    }
    
    const repos = await reposRes.json();
    
    const insertStmt = db.prepare(`
      INSERT INTO projects (id, name, description, status, github_repo)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        github_repo = excluded.github_repo,
        updated_at = CURRENT_TIMESTAMP
    `);
    
    for (const repo of repos) {
      insertStmt.run(
        `gh-${repo.id}`,
        repo.name,
        repo.description || "",
        "active",
        repo.full_name
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      synced: repos.length,
      message: `Synced ${repos.length} repositories` 
    });
    
  } catch (error: any) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}