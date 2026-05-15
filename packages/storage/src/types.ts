export type StorageVariant = "thumb" | "sm" | "md" | "lg" | "original";

export interface UploadResult {
  key: string;
  url: string;
  variants: Partial<Record<StorageVariant, string>>;
  width?: number;
  height?: number;
  sizeBytes: number;
  mimeType: string;
}

export const IMAGE_SIZES: Record<Exclude<StorageVariant, "original">, number> = {
  thumb: 320,
  sm: 640,
  md: 1080,
  lg: 1920,
};
