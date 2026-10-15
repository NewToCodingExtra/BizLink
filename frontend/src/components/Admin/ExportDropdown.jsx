import { useState, useRef, useEffect } from "react";
import { DownloadIcon, ChevronDownIcon, CheckIcon } from "../icons";

export default function ExportDropdown({
  defaultEndpoint = "/admin/export/users",
  defaultLabel = "Export",
  datasets = null, // e.g. [{ label: 'Users Directory', endpoint: '/admin/export/users' }, ...]
}) {
  const [open, setOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(
    datasets ? datasets[0] : { label: defaultLabel, endpoint: defaultEndpoint }
  );
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const endpoint = selectedDataset.endpoint;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface border border-border text-text-primary text-xs font-semibold hover:bg-bg hover:border-action/40 active:scale-95 transition-all cursor-pointer shadow-xs select-none"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <DownloadIcon className="w-4 h-4 text-action" />
        <span>{selectedDataset.label ? `Export ${selectedDataset.label}` : defaultLabel}</span>
        <ChevronDownIcon className={`w-3.5 h-3.5 text-text-secondary transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-surface border border-border/90 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
          {datasets && datasets.length > 1 && (
            <div className="mb-2 pb-2 border-b border-border/80">
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-text-secondary block">
                Select Dataset
              </span>
              <div className="mt-1 space-y-0.5">
                {datasets.map((d) => (
                  <button
                    key={d.endpoint}
                    type="button"
                    onClick={() => setSelectedDataset(d)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      selectedDataset.endpoint === d.endpoint
                        ? "bg-action/10 text-action font-semibold"
                        : "text-text-primary hover:bg-bg"
                    }`}
                  >
                    <span>{d.label}</span>
                    {selectedDataset.endpoint === d.endpoint && (
                      <CheckIcon className="w-3.5 h-3.5 text-action" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1">
            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-text-secondary block">
              Choose File Format
            </span>

            {/* XLSX Format Option (Recommended) */}
            <a
              href={`${endpoint}?format=xlsx`}
              download
              onClick={() => setOpen(false)}
              className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-emerald-500/10 transition-all cursor-pointer border border-transparent hover:border-emerald-500/20"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 grid place-items-center shrink-0 font-bold text-[10px] tracking-tight">
                XLSX
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-text-primary group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    Excel Workbook
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    Recommended
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary mt-0.5 line-clamp-2 leading-tight">
                  Formatted spreadsheet with brand styling, custom auto-fit columns &amp; frozen header.
                </p>
              </div>
            </a>

            {/* CSV Format Option */}
            <a
              href={`${endpoint}?format=csv`}
              download
              onClick={() => setOpen(false)}
              className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-blue-500/10 transition-all cursor-pointer border border-transparent hover:border-blue-500/20"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 grid place-items-center shrink-0 font-bold text-[10px] tracking-tight">
                CSV
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-text-primary group-hover:text-action">
                  CSV Spreadsheet
                </span>
                <p className="text-[11px] text-text-secondary mt-0.5 line-clamp-2 leading-tight">
                  UTF-8 BOM encoded format for data pipelines and simple tabular import.
                </p>
              </div>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
