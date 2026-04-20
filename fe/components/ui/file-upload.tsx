"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/use-translation";

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  label?: string;
  file?: File | null;
  files?: File[];
  preview?: string | null;
  onFile?: (file: File | null) => void;
  onFiles?: (files: File[]) => void;
  uploading?: boolean;
  progress?: number;
  className?: string;
}

export function FileUpload({ accept, multiple, label, file, files, preview, onFile, onFiles, uploading, progress, className }: FileUploadProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLInputElement>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (multiple && onFiles && e.target.files) {
      const newFiles = Array.from(e.target.files);
      onFiles(newFiles);
      setPreviewUrls(newFiles.filter(f => f.type.startsWith("image/")).map(f => URL.createObjectURL(f)));
    } else if (onFile && e.target.files?.[0]) {
      onFile(e.target.files[0]);
    }
    e.target.value = "";
  };

  return (
    <div className={cn("", className)}>
      <input ref={ref} type="file" accept={accept} multiple={multiple} className="hidden" onChange={handleChange} />

      {!multiple && (
        <div
          onClick={() => ref.current?.click()}
          className="border-2 border-dashed dark:border-primary-900/40 rounded-xl p-4 text-center cursor-pointer hover:border-primary dark:hover:border-primary transition-colors bg-primary-50/50 dark:bg-navy-800/50"
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
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label || t("common.tap_to_upload")}</p>
            </>
          )}
          {uploading && (
            <div className="mt-2">
              <div className="h-1.5 bg-primary-100 dark:bg-navy-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress || 0}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      {multiple && (
        <>
          <button
            type="button"
            onClick={() => ref.current?.click()}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-primary-200 dark:border-primary-900/40 bg-white dark:bg-navy-800 text-sm hover:bg-primary-50 dark:hover:bg-navy-800 transition-colors"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} {label || t("common.upload_file")}
          </button>
          {previewUrls.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {previewUrls.map((url, i) => (
                <img key={i} src={url} alt="" className="h-16 w-16 rounded object-cover border dark:border-primary-900/30" />
              ))}
            </div>
          )}
          {files && files.length > 0 && (
            <div className="mt-2 space-y-1">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm bg-primary-50/50 dark:bg-navy-800 rounded px-2 py-1">
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
