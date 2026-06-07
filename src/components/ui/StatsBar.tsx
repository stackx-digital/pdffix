const stats = [
  { value: "15+", label: "Alat PDF Percuma" },
  { value: "100%", label: "Diproses Dalam Pelayar" },
  { value: "0MB", label: "Data Dihantar ke Pelayan" },
  { value: "RM19", label: "Harga Pro Sebulan" },
];

export default function StatsBar() {
  return (
    <section className="bg-red-600 py-10 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-3xl font-bold">{s.value}</p>
            <p className="text-red-200 text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
