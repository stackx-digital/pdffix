const testimonials = [
  {
    name: "Nurul Ain",
    role: "University Student",
    avatar: "NA",
    quote: "I use PDFix every week to merge my lecture notes. It's so easy — no software to install. Best of all, my files never leave my device!",
  },
  {
    name: "Ahmad Faris",
    role: "HR Executive",
    avatar: "AF",
    quote: "I used to use iLovePDF but kept hitting the free limit. PDFix is more affordable and fully featured — sign, watermark, compress, all in one place.",
  },
  {
    name: "Siti Hajar",
    role: "School Teacher",
    avatar: "SH",
    quote: "Easy to use even for someone who's not tech-savvy. I always use it to crop and merge exam questions before sending them to students.",
  },
];

export default function Testimonials() {
  return (
    <section className="bg-gray-50/80 border-y border-gray-100 py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-red-600 uppercase tracking-widest mb-3">Testimonials</p>
          <h2 className="text-3xl font-bold text-gray-900">What Our Users Say</h2>
          <p className="text-gray-500 mt-2">Trusted by students, teachers, and professionals</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200">
              <p className="text-gray-600 text-sm leading-relaxed flex-1">
                <span className="text-red-300 text-3xl font-serif leading-none mr-1 float-left">"</span>
                {t.quote}
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-400 to-red-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
