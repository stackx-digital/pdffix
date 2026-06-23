"use client";

import { useState } from "react";
import { PDFDocument, PDFCheckBox, PDFTextField, PDFRadioGroup, PDFDropdown, PDFOptionList } from "pdf-lib";
import { Upload, Download, FileInput } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { useUsageLimit } from "@/hooks/useUsageLimit";
import UsageLimitBanner from "@/components/ui/UsageLimitBanner";

interface Field {
  name: string;
  type: string;
  value: string;
  options?: string[];
  checked?: boolean;
}

export default function PdfFormsTool() {
  const { status, limitReached, checkLimit, recordUsage } = useUsageLimit("pdf-forms");
  const [file, setFile] = useState<File | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [noForms, setNoForms] = useState(false);

  async function loadFile(f: File) {
    if (f.type !== "application/pdf") return;
    setNoForms(false);
    setResultUrl(null);
    const bytes = await f.arrayBuffer();
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const form = pdf.getForm();
    const rawFields = form.getFields();

    if (rawFields.length === 0) {
      setNoForms(true);
      setFile(f);
      setFields([]);
      return;
    }

    const parsed: Field[] = rawFields.map((field) => {
      const name = field.getName();
      if (field instanceof PDFTextField) {
        return { name, type: "text", value: field.getText() ?? "" };
      } else if (field instanceof PDFCheckBox) {
        return { name, type: "checkbox", value: "", checked: field.isChecked() };
      } else if (field instanceof PDFRadioGroup) {
        return { name, type: "radio", value: field.getSelected() ?? "", options: field.getOptions() };
      } else if (field instanceof PDFDropdown) {
        return { name, type: "dropdown", value: field.getSelected()?.[0] ?? "", options: field.getOptions() };
      } else if (field instanceof PDFOptionList) {
        return { name, type: "optionlist", value: field.getSelected()?.[0] ?? "", options: field.getOptions() };
      }
      return { name, type: "unknown", value: "" };
    });

    setFile(f);
    setFields(parsed);
  }

  function updateField(index: number, key: "value" | "checked", val: string | boolean) {
    setFields((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: val };
      return next;
    });
    setResultUrl(null);
  }

  async function process() {
    if (!file) return;
    const allowed = await checkLimit();
    if (!allowed) return;
    setProcessing(true);
    try {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const form = pdf.getForm();

      fields.forEach((field) => {
        try {
          if (field.type === "text") {
            form.getTextField(field.name).setText(field.value);
          } else if (field.type === "checkbox") {
            const cb = form.getCheckBox(field.name);
            field.checked ? cb.check() : cb.uncheck();
          } else if (field.type === "radio" && field.value) {
            form.getRadioGroup(field.name).select(field.value);
          } else if (field.type === "dropdown" && field.value) {
            form.getDropdown(field.name).select(field.value);
          }
        } catch { /* skip unreadable fields */ }
      });

      const out = await pdf.save();
      await recordUsage();
      setResultUrl(URL.createObjectURL(new Blob([out], { type: "application/pdf" })));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Isi Borang PDF</h1>
      <p className="text-gray-500 mb-8">Isi medan borang interaktif dalam PDF secara terus.</p>

      {status && !status.loggedIn && (
        <UsageLimitBanner used={status.used} limit={status.limit!} loggedIn={status.loggedIn} />
      )}
      {!file ? (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-16 cursor-pointer hover:border-red-400 hover:bg-red-50 transition-colors">
          <Upload className="w-10 h-10 text-gray-400 mb-3" />
          <span className="font-medium text-gray-700">Klik atau seret fail PDF ke sini</span>
          <span className="text-sm text-gray-400 mt-1">PDF yang mengandungi borang interaktif</span>
          <input type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])} />
        </label>
      ) : (
        <div className="space-y-5">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">{formatBytes(file.size)} · {fields.length} medan borang</p>
            </div>
            <button onClick={() => { setFile(null); setFields([]); setNoForms(false); setResultUrl(null); }} className="text-sm text-gray-400 hover:text-gray-600">Tukar</button>
          </div>

          {noForms ? (
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-center">
              <FileInput className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="font-medium text-amber-800">PDF ini tiada borang interaktif</p>
              <p className="text-sm text-amber-600 mt-1">Guna tool Edit PDF untuk tambah teks secara manual.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {fields.map((field, i) => (
                  <div key={field.name} className="p-4 bg-white border border-gray-200 rounded-xl">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">{field.name}</label>
                    {field.type === "text" && (
                      <input
                        type="text" value={field.value}
                        onChange={(e) => updateField(i, "value", e.target.value)}
                        placeholder={`Isi ${field.name}`}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                      />
                    )}
                    {field.type === "checkbox" && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={field.checked} onChange={(e) => updateField(i, "checked", e.target.checked)} className="w-4 h-4 accent-red-600" />
                        <span className="text-sm text-gray-700">{field.checked ? "Ditanda" : "Tidak ditanda"}</span>
                      </label>
                    )}
                    {(field.type === "radio" || field.type === "dropdown" || field.type === "optionlist") && field.options && (
                      <select value={field.value} onChange={(e) => updateField(i, "value", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                        <option value="">-- Pilih --</option>
                        {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    )}
                    {field.type === "unknown" && (
                      <p className="text-xs text-gray-400 italic">Jenis medan tidak disokong</p>
                    )}
                  </div>
                ))}
              </div>

              {resultUrl ? (
                <a href={resultUrl} download={`filled_${file.name}`} className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700">
                  <Download className="w-5 h-5" /> Muat Turun PDF Borang Terisi
                </a>
              ) : (
                <button onClick={process} disabled={processing || limitReached} className="w-full py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-60">
                  {processing ? "Menyimpan..." : "Simpan & Muat Turun"}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
