const stats = [
  { value: "15+", label: "Free PDF Tools", icon: "🛠️" },
  { value: "100%", label: "Processed In-Browser", icon: "🔒" },
  { value: "0MB", label: "Data Sent to Servers", icon: "🛡️" },
  { value: "RM19", label: "Pro Price Per Month", icon: "💎" },
];

export default function StatsBar() {
  return (
    <section className="bg-gray-950 py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-800 rounded-2xl overflow-hidden">
          {stats.map((s) => (
            <div key={s.label} className="bg-gray-950 px-8 py-10 text-center">
              <p className="text-3xl mb-1">{s.icon}</p>
              <p className="text-4xl font-extrabold text-white tracking-tight">{s.value}</p>
              <p className="text-gray-500 text-sm mt-2 leading-snug">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
