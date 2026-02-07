import Dashboard from "@/components/Dashboard";

export default function Home() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        📊 Project Dashboard
      </h1>
      <Dashboard />
    </main>
  );
}
