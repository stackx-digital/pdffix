const stats = [
  { value: "15+", label: "Alat PDF Percuma" },
  { value: "100%", label: "Diproses Dalam Pelayar" },
  { value: "0MB", label: "Data Dihantar ke Pelayan" },
  { value: "RM19", label: "Harga Pro Sebulan" },
];

export default function StatsBar() {
  return (
    <section className="bg-gradient-to-r from-red-700 via-red-600 to-red-700 py-12 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
        {stats.map((s, i) => (
          <div key={s.label} className={`${i < stats.length - 1 ? "md:border-r md:border-red-500" : ""}`}>
            <p className="text-4xl font-extrabold tracking-tight">{s.value}</p>
            <p className="text-red-200 text-sm mt-1.5">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
