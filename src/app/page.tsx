import MissionControl from "@/components/MissionControl";

export default function Home() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🎯 Agent Mission Control</h1>
        <p className="text-gray-500 mt-1">Coordinate AI agents and track development progress</p>
      </div>
      <MissionControl />
    </main>
  );
}
