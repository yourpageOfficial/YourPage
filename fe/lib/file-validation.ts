export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export interface FileValidationOptions {
  maxSize?: number;
  allowedTypes?: string[];
}

export function validateFile(
  file: File,
  options: FileValidationOptions = {}
): FileValidationResult {
  const { maxSize = 2 * 1024 * 1024, allowedTypes = [] } = options;

  if (maxSize && file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  if (allowedTypes.length > 0) {
    const isAllowed = allowedTypes.some((type) => {
      if (type.endsWith("/*")) {
        return file.type.startsWith(type.replace("/*", ""));
      }
      return file.type === type;
    });

    if (!isAllowed) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed`,
      };
    }
  }

  return { valid: true };
}

export function validateImageFile(file: File, maxSizeMB = 2): FileValidationResult {
  const imageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  return validateFile(file, {
    maxSize: maxSizeMB * 1024 * 1024,
    allowedTypes: imageTypes,
  });
}

export const AVATAR_ASPECT_RATIO = "aspect-square";
export const BANNER_ASPECT_RATIO = "aspect-[3/1]";

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
