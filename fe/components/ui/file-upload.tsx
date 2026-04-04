"use client";

import { useRef, useState } from "react";
import { Upload, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateFile, validateImageFile, formatFileSize, FileValidationOptions } from "@/lib/file-validation";

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
  validation?: FileValidationOptions;
  aspectRatio?: "avatar" | "banner" | "square" | "video";
  hint?: string;
}

const aspectRatioClasses = {
  avatar: "aspect-square",
  banner: "aspect-[3/1]",
  square: "aspect-square",
  video: "aspect-video",
};

export function FileUpload({ 
  accept, 
  multiple, 
  label, 
  file, 
  files, 
  preview, 
  onFile, 
  onFiles, 
  className,
  validation,
  aspectRatio,
  hint,
}: FileUploadProps) {
  const ref = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    
    if (multiple && onFiles && e.target.files) {
      const newFiles = Array.from(e.target.files);
      
      if (validation) {
        for (const f of newFiles) {
          const result = validation.allowedTypes?.some(t => t.startsWith("image/")) 
            ? validateImageFile(f, (validation.maxSize || Infinity) / (1024 * 1024))
            : validateFile(f, validation);
          
          if (!result.valid) {
            setError(result.error || "Invalid file");
            e.target.value = "";
            return;
          }
        }
      }
      
      onFiles(newFiles);
    } else if (onFile && e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      
      if (validation) {
        const isImage = accept?.startsWith("image");
        const result = isImage 
          ? validateImageFile(selectedFile, (validation.maxSize || Infinity) / (1024 * 1024))
          : validateFile(selectedFile, validation);
        
        if (!result.valid) {
          setError(result.error || "Invalid file");
          e.target.value = "";
          return;
        }
      }
      
      onFile(selectedFile);
    }
    e.target.value = "";
  };

  return (
    <div className={cn("", className)}>
      <input ref={ref} type="file" accept={accept} multiple={multiple} className="hidden" onChange={handleChange} />

      {!multiple && (
        <div
          onClick={() => ref.current?.click()}
          className={cn(
            "border-2 border-dashed dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-primary dark:hover:border-primary transition-colors bg-gray-50 dark:bg-gray-800/50",
            aspectRatio && aspectRatioClasses[aspectRatio]
          )}
        >
          {preview || file ? (
            <div className="relative">
              {preview && (
                <img 
                  src={preview} 
                  alt="" 
                  className={cn("mx-auto rounded object-contain", aspectRatio ? "w-full h-full" : "max-h-32")} 
                />
              )}
              {file && !preview && (
                <div className="flex items-center justify-center gap-2">
                  <p className="text-sm truncate">{file.name}</p>
                  <span className="text-xs text-gray-400">{formatFileSize(file.size)}</span>
                </div>
              )}
              <button 
                onClick={(e) => { e.stopPropagation(); setError(null); onFile?.(null); }} 
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center"
              >
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
                  <span className="text-gray-400 text-xs shrink-0">{formatFileSize(f.size)}</span>
                  <button onClick={() => onFiles?.(files.filter((_, j) => j !== i))} className="text-red-500 shrink-0">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {error && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
      
      {hint && !error && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{hint}</p>
      )}
    </div>
  );
}
