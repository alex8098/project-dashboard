"use client";

import { useState, useEffect } from "react";
import { 
  Bot, Plus, Trash2, Play, CheckCircle, Clock, AlertCircle, 
  GitBranch, MessageSquare, Activity, Users 
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  status: 'idle' | 'working' | 'error' | 'terminated';
  current_task: string | null;
  model: string;
  active_tasks: number;
  unread_reports: number;
  last_ping: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'in-progress' | 'review' | 'completed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  assigned_name: string | null;
  assigned_to: string | null;
}

export default function MissionControl() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'tasks'>('overview');
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showSpawnModal, setShowSpawnModal] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentTask, setNewAgentTask] = useState('');

  useEffect(() => {
    setMounted(true);
    loadData();
    const interval = setInterval(loadData, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [agentsRes, tasksRes] = await Promise.all([
        fetch("/api/agents"),
        fetch("/api/tasks")
      ]);
      
      const agentsData = await agentsRes.json();
      const tasksData = await tasksRes.json();
      
      setAgents(agentsData.agents || []);
      setTasks(tasksData.tasks || []);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const spawnAgent = async () => {
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAgentName || `Agent-${Date.now()}`,
          task: newAgentTask || undefined
        })
      });
      
      if (res.ok) {
        setShowSpawnModal(false);
        setNewAgentName('');
        setNewAgentTask('');
        loadData();
      }
    } catch (error) {
      console.error("Failed to spawn agent:", error);
    }
  };

  const killAgent = async (id: string) => {
    if (!confirm('Terminate this agent?')) return;
    try {
      await fetch(`/api/agents?id=${id}`, { method: "DELETE" });
      loadData();
    } catch (error) {
      console.error("Failed to kill agent:", error);
    }
  };

  const createTask = async (title: string, priority: string = 'medium') => {
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, priority })
      });
      loadData();
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  if (!mounted) {
    return <div className="p-8 text-center">Loading Mission Control...</div>;
  }

  const workingAgents = agents.filter(a => a.status === 'working').length;
  const idleAgents = agents.filter(a => a.status === 'idle').length;
  const backlogTasks = tasks.filter(t => t.status === 'backlog').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Bot />} label="Active Agents" value={agents.length} color="blue" />
        <StatCard icon={<Activity />} label="Working" value={workingAgents} color="green" />
        <StatCard icon={<Clock />} label="Backlog" value={backlogTasks} color="yellow" />
        <StatCard icon={<Play />} label="In Progress" value={inProgressTasks} color="purple" />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {['overview', 'agents', 'tasks'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-4 px-2 font-medium capitalize ${
                activeTab === tab 
                  ? 'border-b-2 border-blue-600 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <OverviewView 
          agents={agents} 
          tasks={tasks} 
          onSpawn={() => setShowSpawnModal(true)}
        />
      )}
      
      {activeTab === 'agents' && (
        <AgentsView 
          agents={agents} 
          onSpawn={() => setShowSpawnModal(true)}
          onKill={killAgent}
        />
      )}
      
      {activeTab === 'tasks' && (
        <TasksView 
          tasks={tasks} 
          agents={agents}
          onCreateTask={createTask}
        />
      )}

      {/* Spawn Agent Modal */}
      {showSpawnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Spawn New Agent</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Agent Name</label>
                <input
                  type="text"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  placeholder="e.g., Frontend-Dev-1"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Initial Task (optional)</label>
                <textarea
                  value={newAgentTask}
                  onChange={(e) => setNewAgentTask(e.target.value)}
                  placeholder="e.g., Build login page with OAuth"
                  className="w-full px-3 py-2 border rounded-lg h-24"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSpawnModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={spawnAgent}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Spawn Agent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    yellow: "bg-yellow-50 text-yellow-700",
    purple: "bg-purple-50 text-purple-700",
  };

  return (
    <div className={`${colors[color]} rounded-lg p-4`}>
      <div className="flex items-center gap-2 mb-1">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm opacity-75">{label}</div>
    </div>
  );
}

function OverviewView({ agents, tasks, onSpawn }: any) {
  const recentTasks = tasks.slice(0, 5);
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Active Agents */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="font-semibold">Active Agents</h3>
          <button onClick={onSpawn} className="text-blue-600 hover:text-blue-700">
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="divide-y">
          {agents.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No agents running. Spawn one to start!
            </div>
          ) : (
            agents.slice(0, 5).map((agent: Agent) => (
              <div key={agent.id} className="px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    agent.status === 'working' ? 'bg-green-500 animate-pulse' :
                    agent.status === 'idle' ? 'bg-blue-500' : 'bg-gray-400'
                  }`} />
                  <div>
                    <p className="font-medium">{agent.name}</p>
                    <p className="text-sm text-gray-500">{agent.current_task || 'Idle'}</p>
                  </div>
                </div>
                <StatusBadge status={agent.status} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold">Recent Tasks</h3>
        </div>
        <div className="divide-y">
          {recentTasks.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No tasks yet. Create one!
            </div>
          ) : (
            recentTasks.map((task: Task) => (
              <div key={task.id} className="px-6 py-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-gray-500">
                      {task.assigned_name ? `Assigned to: ${task.assigned_name}` : 'Unassigned'}
                    </p>
                  </div>
                  <PriorityBadge priority={task.priority} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function AgentsView({ agents, onSpawn, onKill }: any) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b flex justify-between items-center">
        <h3 className="font-semibold">Agent Fleet</h3>
        <button 
          onClick={onSpawn}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Spawn Agent
        </button>
      </div>
      <div className="divide-y">
        {agents.map((agent: Agent) => (
          <div key={agent.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
            <div className="flex items-center gap-4">
              <Bot className="w-8 h-8 text-gray-400" />
              <div>
                <p className="font-medium">{agent.name}</p>
                <p className="text-sm text-gray-500">ID: {agent.id.slice(0, 8)}...</p>
                {agent.current_task && (
                  <p className="text-sm text-blue-600">{agent.current_task}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <StatusBadge status={agent.status} />
                <p className="text-xs text-gray-400 mt-1">
                  {agent.active_tasks} active tasks
                </p>
              </div>
              <button 
                onClick={() => onKill(agent.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TasksView({ tasks, agents, onCreateTask }: any) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      onCreateTask(newTaskTitle);
      setNewTaskTitle('');
    }
  };

  const columns = ['backlog', 'in-progress', 'review', 'completed'];
  
  return (
    <div className="space-y-4">
      {/* Create Task */}
      <form onSubmit={handleCreate} className="bg-white rounded-lg shadow p-4 flex gap-3">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Create a new task..."
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <button 
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Add Task
        </button>
      </form>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {columns.map((status) => (
          <div key={status} className="bg-gray-100 rounded-lg p-4">
            <h4 className="font-medium capitalize mb-3">{status.replace('-', ' ')}</h4>
            <div className="space-y-2">
              {tasks
                .filter((t: Task) => t.status === status)
                .map((task: Task) => (
                  <div key={task.id} className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="font-medium text-sm">{task.title}</p>
                    {task.assigned_name && (
                      <p className="text-xs text-gray-500 mt-1">
                        👤 {task.assigned_name}
                      </p>
                    )}
                    <PriorityBadge priority={task.priority} />
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: any = {
    idle: 'bg-blue-100 text-blue-800',
    working: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
    terminated: 'bg-gray-100 text-gray-800',
  };
  
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || colors.idle}`}>
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: any = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-gray-100 text-gray-800',
  };
  
  return (
    <span className={`px-2 py-0.5 rounded text-xs ${colors[priority] || colors.medium}`}>
      {priority}
    </span>
  );
}