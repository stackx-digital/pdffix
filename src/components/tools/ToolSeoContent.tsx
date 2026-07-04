interface Props {
  steps: string[];
  faqs: { q: string; a: string }[];
}

export default function ToolSeoContent({ steps, faqs }: Props) {
  return (
    <div className="mt-16 border-t border-gray-100 pt-12 space-y-12 max-w-2xl mx-auto px-4">
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-5">How to use</h2>
        <ol className="space-y-3">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span className="w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="text-sm text-gray-600 leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="pb-12">
        <h2 className="text-lg font-bold text-gray-900 mb-5">Frequently asked questions</h2>
        <div className="space-y-5">
          {faqs.map((faq, i) => (
            <div key={i}>
              <h3 className="text-sm font-semibold text-gray-800">{faq.q}</h3>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
