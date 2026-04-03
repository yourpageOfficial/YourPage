"use client";

import { useRef } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  label?: string;
  file?: File | null;
  files?: File[];
  preview?: string | null;
  onFile?: (file: File | null) => void;
  onFiles?: (files: File[]) => void;
  className?: string;
}

export function FileUpload({ accept, multiple, label, file, files, preview, onFile, onFiles, className }: FileUploadProps) {
  const ref = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (multiple && onFiles && e.target.files) {
      onFiles(Array.from(e.target.files));
    } else if (onFile && e.target.files?.[0]) {
      onFile(e.target.files[0]);
    }
    e.target.value = "";
  };

  return (
    <div className={cn("", className)}>
      <input ref={ref} type="file" accept={accept} multiple={multiple} className="hidden" onChange={handleChange} />

      {/* Single file with preview */}
      {!multiple && (
        <div
          onClick={() => ref.current?.click()}
          className="border-2 border-dashed dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-primary dark:hover:border-primary transition-colors bg-gray-50 dark:bg-gray-800/50"
        >
          {preview || file ? (
            <div className="relative">
              {preview && <img src={preview} alt="" className="mx-auto max-h-32 rounded object-contain" />}
              {file && !preview && <p className="text-sm truncate">{file.name}</p>}
              <button onClick={(e) => { e.stopPropagation(); onFile?.(null); }} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center">
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-500" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label || "Tap untuk upload"}</p>
            </>
          )}
        </div>
      )}

      {/* Multiple files */}
      {multiple && (
        <>
          <button
            type="button"
            onClick={() => ref.current?.click()}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Upload className="h-4 w-4" /> {label || "Upload File"}
          </button>
          {files && files.length > 0 && (
            <div className="mt-2 space-y-1">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-800 rounded px-2 py-1">
                  <span className="truncate flex-1">{f.name}</span>
                  <span className="text-gray-400 text-xs shrink-0">{(f.size / 1024).toFixed(0)}KB</span>
                  <button onClick={() => onFiles?.(files.filter((_, j) => j !== i))} className="text-red-500 shrink-0">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
