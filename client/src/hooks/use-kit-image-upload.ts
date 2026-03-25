import { useState, useCallback } from "react";

interface UploadedImage {
  id: string;
  name: string;
  url: string;
  type: "image";
  thumbnail?: string;
}

interface UseKitImageUploadOptions {
  onSuccess?: (images: UploadedImage[]) => void;
  onError?: (error: Error) => void;
}

export function useKitImageUpload(options: UseKitImageUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const uploadSingleImage = useCallback(
    async (file: File): Promise<UploadedImage | null> => {
      try {
        const response = await fetch("/api/uploads/request-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: file.name,
            size: file.size,
            contentType: file.type || "image/jpeg",
          }),
        });

        if (!response.ok) {
          throw new Error("Falha ao obter URL de upload");
        }

        const { uploadURL, objectPath } = await response.json();

        const uploadResponse = await fetch(uploadURL, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type || "image/jpeg" },
        });

        if (!uploadResponse.ok) {
          throw new Error("Falha ao enviar imagem");
        }

        return {
          id: crypto.randomUUID(),
          name: file.name,
          url: objectPath,
          type: "image",
          thumbnail: objectPath,
        };
      } catch (err) {
        console.error("Error uploading image:", err);
        return null;
      }
    },
    []
  );

  const uploadImages = useCallback(
    async (files: FileList | File[]): Promise<UploadedImage[]> => {
      setIsUploading(true);
      setError(null);
      setProgress(0);

      const fileArray = Array.from(files);
      const uploadedImages: UploadedImage[] = [];

      try {
        for (let i = 0; i < fileArray.length; i++) {
          const file = fileArray[i];
          const result = await uploadSingleImage(file);
          if (result) {
            uploadedImages.push(result);
          }
          setProgress(Math.round(((i + 1) / fileArray.length) * 100));
        }

        if (uploadedImages.length > 0) {
          options.onSuccess?.(uploadedImages);
        }

        return uploadedImages;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Upload falhou");
        setError(error);
        options.onError?.(error);
        return uploadedImages;
      } finally {
        setIsUploading(false);
      }
    },
    [uploadSingleImage, options]
  );

  const uploadBoxImage = useCallback(
    async (file: File): Promise<string | null> => {
      setIsUploading(true);
      setError(null);

      try {
        const result = await uploadSingleImage(file);
        return result?.url || null;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Upload falhou");
        setError(error);
        options.onError?.(error);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [uploadSingleImage, options]
  );

  return {
    uploadImages,
    uploadBoxImage,
    isUploading,
    progress,
    error,
  };
}
