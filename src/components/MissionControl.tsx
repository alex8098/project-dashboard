"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Bot, Plus, Trash2, Play, CheckCircle, Clock, AlertCircle, 
  GitBranch, MessageSquare, Activity, Users, RefreshCw, 
  ExternalLink, MoreHorizontal, Filter, Search, Bell
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
  is_live?: boolean;
  openclaw_session?: {
    sessionKey: string;
    status: string;
  } | null;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'in-progress' | 'review' | 'completed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  assigned_name: string | null;
  assigned_to: string | null;
  github_issue_number?: number;
  created_at: string;
}

interface Report {
  id: string;
  agent_id: string;
  agent_name: string;
  task_id: string;
  task_title: string;
  type: 'progress' | 'completion' | 'question' | 'error';
  title: string;
  content: string;
  status: 'unread' | 'read' | 'archived';
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  github_repo: string;
  status: string;
}

export default function MissionControl() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'tasks' | 'reports'>('overview');
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  
  // Modal states
  const [showSpawnModal, setShowSpawnModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentTask, setNewAgentTask] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');

  useEffect(() => {
    setMounted(true);
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [agentsRes, tasksRes, reportsRes] = await Promise.all([
        fetch("/api/agents"),
        fetch("/api/tasks"),
        fetch("/api/reports?status=unread&limit=10"),
      ]);
      
      const agentsData = await agentsRes.json();
      const tasksData = await tasksRes.json();
      const reportsData = await reportsRes.json();
      
      setAgents(agentsData.agents || []);
      setTasks(tasksData.tasks || []);
      setReports(reportsData.reports || []);
    } catch (error: any) {
      console.error("Failed to load data:", error);
      setError("Failed to connect to dashboard API");
    } finally {
      setLoading(false);
    }
  }, []);

  const syncGitHub = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/sync-github", { method: "POST" });
      const data = await res.json();
      
      if (res.ok) {
        showNotification(`✅ Synced ${data.synced} repos, ${data.issues_imported} issues`);
        loadData();
      } else {
        setError(data.error || "Sync failed");
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setSyncing(false);
    }
  };

  const spawnAgent = async () => {
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAgentName || `Agent-${Date.now().toString(36)}`,
          task: newAgentTask || undefined
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        showNotification(`🚀 Agent "${data.agent.name}" spawned!`);
        setShowSpawnModal(false);
        setNewAgentName('');
        setNewAgentTask('');
        loadData();
      } else {
        setError(data.error || "Failed to spawn agent");
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle,
          priority: newTaskPriority
        })
      });
      
      if (res.ok) {
        showNotification("✅ Task created!");
        setShowTaskModal(false);
        setNewTaskTitle('');
        loadData();
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status })
      });
      loadData();
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const killAgent = async (id: string) => {
    if (!confirm('⚠️ Terminate this agent?')) return;
    try {
      await fetch(`/api/agents?id=${id}`, { method: "DELETE" });
      showNotification("🗑️ Agent terminated");
      loadData();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const markReportRead = async (reportId: string) => {
    try {
      await fetch("/api/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reportId, status: 'read' })
      });
      loadData();
    } catch (error) {
      console.error("Failed to mark report read:", error);
    }
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-gray-400">Loading Mission Control...</div>
      </div>
    );
  }

  const workingAgents = agents.filter(a => a.status === 'working').length;
  const idleAgents = agents.filter(a => a.status === 'idle').length;
  const unreadReports = reports.filter(r => r.status === 'unread').length;
  const criticalTasks = tasks.filter(t => t.priority === 'critical' && t.status !== 'completed').length;

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          {notification}
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            ✕
          </button>
        </div>
      )}

      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Bot />} label="Active Agents" value={agents.length} color="blue" subtext={`${workingAgents} working`} />
        <StatCard icon={<Clock />} label="Pending Tasks" value={tasks.filter(t => t.status !== 'completed').length} color="yellow" subtext={`${criticalTasks} critical`} />
        <StatCard icon={<Bell />} label="Unread Reports" value={unreadReports} color="red" subtext="needs attention" />
        <StatCard icon={<CheckCircle />} label="Completed" value={tasks.filter(t => t.status === 'completed').length} color="green" />
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setShowSpawnModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Spawn Agent
        </button>
        <button
          onClick={() => setShowTaskModal(true)}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Task
        </button>
        <button
          onClick={syncGitHub}
          disabled={syncing}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} /> 
          {syncing ? 'Syncing...' : 'Sync GitHub'}
        </button>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'agents', label: `Agents (${agents.length})`, icon: Bot },
            { id: 'tasks', label: `Tasks (${tasks.length})`, icon: Clock },
            { id: 'reports', label: `Reports (${unreadReports})`, icon: MessageSquare },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm ${
                activeTab === tab.id 
                  ? 'border-b-2 border-blue-600 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <OverviewView agents={agents} tasks={tasks} reports={reports} />
      )}
      {activeTab === 'agents' && (
        <AgentsView agents={agents} onSpawn={() => setShowSpawnModal(true)} onKill={killAgent} />
      )}
      {activeTab === 'tasks' && (
        <TasksView tasks={tasks} agents={agents} onUpdateStatus={updateTaskStatus} />
      )}
      {activeTab === 'reports' && (
        <ReportsView reports={reports} onMarkRead={markReportRead} />
      )}

      {/* Modals */}
      {showSpawnModal && (
        <Modal title="Spawn New Agent" onClose={() => setShowSpawnModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Agent Name *</label>
              <input
                type="text"
                value={newAgentName}
                onChange={(e) => setNewAgentName(e.target.value)}
                placeholder="e.g., Frontend-Dev-1"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Initial Task</label>
              <textarea
                value={newAgentTask}
                onChange={(e) => setNewAgentTask(e.target.value)}
                placeholder="What should this agent work on?"
                className="w-full px-3 py-2 border rounded-lg h-24 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setShowSpawnModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button 
              onClick={spawnAgent}
              disabled={!newAgentName.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              🚀 Spawn Agent
            </button>
          </div>
        </Modal>
      )}

      {showTaskModal && (
        <Modal title="Create New Task" onClose={() => setShowTaskModal(false)}>
          <form onSubmit={createTask} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Task Title *</label>
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="critical">🔴 Critical</option>
                <option value="high">🟠 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setShowTaskModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                ✅ Create Task
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// Sub-components
function StatCard({ icon, label, value, color, subtext }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div className={`${colors[color]} border rounded-lg p-4`}>
      <div className="flex items-center gap-2 mb-1">{icon}</div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm font-medium">{label}</div>
      {subtext && <div className="text-xs opacity-75 mt-1">{subtext}</div>}
    </div>
  );
}

function Modal({ title, children, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

function OverviewView({ agents, tasks, reports }: any) {
  const recentTasks = tasks.slice(0, 5);
  const recentReports = reports.slice(0, 3);
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" /> Recent Activity
          </h3>
        </div>
        <div className="divide-y max-h-80 overflow-auto">
          {recentReports.length === 0 && recentTasks.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No recent activity. Spawn an agent to get started!
            </div>
          ) : (
            <>
              {recentReports.map((report: Report) => (
                <div key={report.id} className="px-6 py-3 hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-4 h-4 text-blue-500 mt-1" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{report.title}</p>
                      <p className="text-xs text-gray-500">
                        {report.agent_name} • {new Date(report.created_at).toLocaleString()}
                      </p>
                    </div>
                    <StatusBadge status={report.type} />
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Agent Status */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-600" /> Agent Status
          </h3>
        </div>
        <div className="divide-y max-h-80 overflow-auto">
          {agents.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No agents running
            </div>
          ) : (
            agents.map((agent: Agent) => (
              <div key={agent.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    agent.status === 'working' ? 'bg-green-500 animate-pulse' :
                    agent.status === 'idle' ? 'bg-blue-500' : 'bg-gray-400'
                  }`} />
                  <div>
                    <p className="font-medium text-sm">{agent.name}</p>
                    <p className="text-xs text-gray-500 truncate max-w-xs">
                      {agent.current_task || 'Idle'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {agent.is_live && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                      ● Live
                    </span>
                  )}
                  <StatusBadge status={agent.status} />
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
    <div className="bg-white rounded-lg shadow border">
      <div className="px-6 py-4 border-b flex justify-between items-center">
        <h3 className="font-semibold flex items-center gap-2">
          <Users className="w-5 h-5" /> Agent Fleet ({agents.length})
        </h3>
        <button 
          onClick={onSpawn}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Spawn Agent
        </button>
      </div>
      <div className="divide-y">
        {agents.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Bot className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No agents running</p>
            <button onClick={onSpawn} className="mt-4 text-blue-600 hover:underline">
              Spawn your first agent
            </button>
          </div>
        ) : (
          agents.map((agent: Agent) => (
            <div key={agent.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                  {agent.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{agent.name}</p>
                  <p className="text-sm text-gray-500">ID: {agent.id.slice(-8)}</p>
                  {agent.current_task && (
                    <p className="text-sm text-blue-600 mt-1">{agent.current_task}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <StatusBadge status={agent.status} />
                  <p className="text-xs text-gray-400 mt-1">
                    {agent.active_tasks} tasks • {agent.unread_reports} reports
                  </p>
                </div>
                <button 
                  onClick={() => onKill(agent.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Terminate agent"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TasksView({ tasks, agents, onUpdateStatus }: any) {
  const columns = [
    { id: 'backlog', title: '📋 Backlog', color: 'bg-gray-100' },
    { id: 'in-progress', title: '🔄 In Progress', color: 'bg-blue-50' },
    { id: 'review', title: '👀 Review', color: 'bg-yellow-50' },
    { id: 'completed', title: '✅ Completed', color: 'bg-green-50' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((col) => (
        <div key={col.id} className={`${col.color} rounded-lg p-4 min-h-[400px]`}>
          <h4 className="font-semibold mb-3 flex items-center justify-between">
            {col.title}
            <span className="text-sm font-normal text-gray-500">
              {tasks.filter((t: Task) => t.status === col.id).length}
            </span>
          </h4>
          <div className="space-y-2">
            {tasks
              .filter((t: Task) => t.status === col.id)
              .map((task: Task) => (
                <TaskCard key={task.id} task={task} agents={agents} onUpdateStatus={onUpdateStatus} />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TaskCard({ task, agents, onUpdateStatus }: { task: Task; agents: Agent[]; onUpdateStatus: (id: string, status: string) => void }) {
  const nextStatus = {
    'backlog': 'in-progress',
    'in-progress': 'review',
    'review': 'completed',
    'completed': 'backlog',
  };

  const priorityColors: any = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <div className="bg-white rounded-lg p-3 shadow-sm border hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <PriorityBadge priority={task.priority} />
        {task.github_issue_number && (
          <a 
            href={`#`}
            className="text-xs text-gray-400 hover:text-blue-600"
            title="GitHub Issue"
          >
            #{task.github_issue_number}
          </a>
        )}
      </div>
      <p className="font-medium text-sm mb-2">{task.title}</p>
      {task.assigned_name && (
        <p className="text-xs text-gray-500 mb-2">👤 {task.assigned_name}</p>
      )}
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-400">
          {new Date(task.created_at).toLocaleDateString()}
        </span>
        <button
          onClick={() => onUpdateStatus(task.id, nextStatus[task.status])}
          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
        >
          Move →
        </button>
      </div>
    </div>
  );
}

function ReportsView({ reports, onMarkRead }: any) {
  return (
    <div className="bg-white rounded-lg shadow border">
      <div className="px-6 py-4 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageSquare className="w-5 h-5" /> Agent Reports
        </h3>
      </div>
      <div className="divide-y">
        {reports.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            No reports yet
          </div>
        ) : (
          reports.map((report: Report) => (
            <div key={report.id} className={`px-6 py-4 ${report.status === 'unread' ? 'bg-blue-50/30' : ''}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <StatusBadge status={report.type} />
                  <span className="text-sm font-medium">{report.title}</span>
                </div>
                {report.status === 'unread' && (
                  <button
                    onClick={() => onMarkRead(report.id)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Mark read
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2 whitespace-pre-wrap">{report.content}</p>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>👤 {report.agent_name}</span>
                <span>📋 {report.task_title || 'No task'}</span>
                <span>🕐 {new Date(report.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    // Agent statuses
    idle: 'bg-blue-100 text-blue-800',
    working: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
    terminated: 'bg-gray-100 text-gray-800',
    // Task priorities
    critical: 'bg-red-100 text-red-800 border border-red-200',
    high: 'bg-orange-100 text-orange-800 border border-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    low: 'bg-gray-100 text-gray-800 border border-gray-200',
    // Report types
    progress: 'bg-blue-100 text-blue-800',
    completion: 'bg-green-100 text-green-800',
    question: 'bg-yellow-100 text-yellow-800',
  };
  
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status] || styles.idle}`}>
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: any = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢',
  };
  
  return (
    <span className="text-xs" title={priority}>
      {colors[priority] || '⚪'}
    </span>
  );
}