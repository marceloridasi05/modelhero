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
        console.log("🔍 [UPLOAD] Iniciando upload para arquivo:", file.name, "Tamanho:", file.size);

        // Use multipart/form-data upload via server (avoids CORS issues)
        const formData = new FormData();
        formData.append("file", file);

        const uploadResponse = await fetch("/api/uploads/upload", {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        console.log("📤 [UPLOAD] Resposta do servidor:", uploadResponse.status, uploadResponse.statusText);

        if (!uploadResponse.ok) {
          // Try to extract error message from response
          try {
            const errorData = await uploadResponse.json();
            console.error("❌ [UPLOAD] Erro no upload:", errorData);
            throw new Error(errorData.error || "Falha ao fazer upload");
          } catch {
            throw new Error("Falha ao fazer upload");
          }
        }

        const uploadedData = await uploadResponse.json();
        console.log("✅ [UPLOAD] Arquivo enviado com sucesso:", file.name, "URL:", uploadedData.url);

        return {
          id: uploadedData.id,
          name: uploadedData.name,
          url: uploadedData.url,
          type: "image",
          thumbnail: uploadedData.thumbnail || uploadedData.url,
        };
      } catch (err) {
        console.error("❌ [UPLOAD] Erro ao fazer upload:", err);
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
    uploadSingleImage,
    isUploading,
    progress,
    error,
  };
}
