"use client";

import { useState, useEffect } from "react";
import { GitBranch, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string;
  status: "active" | "completed" | "on-hold";
  githubRepo?: string;
  tasks: Task[];
}

interface Task {
  id: string;
  title: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  dueDate?: string;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const syncGitHub = async () => {
    try {
      await fetch("/api/sync-github", { method: "POST" });
      fetchProjects();
    } catch (error) {
      console.error("Failed to sync:", error);
    }
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-lg p-4 h-24 animate-pulse" />
          ))}
        </div>
        <div className="bg-gray-100 rounded-lg shadow h-20 animate-pulse" />
        <div className="bg-gray-100 rounded-lg shadow h-64 animate-pulse" />
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<GitBranch className="w-5 h-5" />}
          label="Projects"
          value={projects.length}
          color="blue"
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5" />}
          label="Completed"
          value={projects.filter(p => p.status === "completed").length}
          color="green"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="In Progress"
          value={projects.filter(p => p.status === "active").length}
          color="yellow"
        />
        <StatCard
          icon={<AlertCircle className="w-5 h-5" />}
          label="On Hold"
          value={projects.filter(p => p.status === "on-hold").length}
          color="red"
        />
      </div>

      {/* GitHub Sync */}
      <div className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
        <div>
          <h2 className="font-semibold text-gray-900">GitHub Integration</h2>
          <p className="text-sm text-gray-500">Sync your repos and issues</p>
        </div>
        <button
          onClick={syncGitHub}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
        >
          🔄 Sync with GitHub
        </button>
      </div>

      {/* Projects */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Your Projects</h2>
        </div>
        {projects.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            No projects yet. Click &quot;Sync with GitHub&quot; to import!
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "blue" | "green" | "yellow" | "red";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    yellow: "bg-yellow-50 text-yellow-700",
    red: "bg-red-50 text-red-700",
  };

  return (
    <div className={`${colors[color]} rounded-lg p-4`}>
      <div className="flex items-center gap-2 mb-1">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm opacity-75">{label}</div>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const statusColors = {
    active: "bg-green-100 text-green-800",
    completed: "bg-blue-100 text-blue-800",
    "on-hold": "bg-yellow-100 text-yellow-800",
  };

  return (
    <div className="px-6 py-4 hover:bg-gray-50">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-gray-900">{project.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{project.description}</p>
          {project.githubRepo && (
            <a
              href={`https://github.com/${project.githubRepo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline mt-1 inline-block"
            >
              📁 {project.githubRepo}
            </a>
          )}
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[project.status]}`}>
          {project.status}
        </span>
      </div>
    </div>
  );
}