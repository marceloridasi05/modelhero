import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, AlertCircle } from "lucide-react";
import { useKitImageUpload } from "@/hooks/use-kit-image-upload";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PhotoUploadFieldProps {
  onPhotoUploaded: (photo: { id: string; name: string; url: string; type: "image"; thumbnail?: string }) => void;
  accept?: string;
  label?: string;
  maxSizeMB?: number;
  disabled?: boolean;
}

export default function PhotoUploadField({
  onPhotoUploaded,
  accept = "image/*",
  label = "Upload Photo",
  maxSizeMB = 15,
  disabled = false,
}: PhotoUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { uploadSingleImage } = useKitImageUpload({
    onError: (err) => {
      setError(err.message);
      setIsUploading(false);
    },
  });

  // Attach vanilla event listener for file selection
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const handleFileChange = async (e: Event) => {
      const fileInput = e.target as HTMLInputElement;
      if (!fileInput.files || fileInput.files.length === 0) return;

      const file = fileInput.files[0];

      // Validate file size
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        setError(`File size exceeds ${maxSizeMB}MB limit`);
        fileInput.value = "";
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file");
        fileInput.value = "";
        return;
      }

      setError(null);
      setIsUploading(true);

      try {
        console.log("📸 [PHOTO FIELD] Starting upload for file:", file.name);
        const uploadedPhoto = await uploadSingleImage(file);

        if (uploadedPhoto) {
          console.log("✅ [PHOTO FIELD] Upload successful:", uploadedPhoto);
          onPhotoUploaded(uploadedPhoto);
        } else {
          setError("Upload failed. Please try again.");
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Upload failed";
        setError(errorMsg);
        console.error("❌ [PHOTO FIELD] Upload error:", err);
      } finally {
        setIsUploading(false);
        // Reset input so same file can be selected again
        fileInput.value = "";
      }
    };

    input.addEventListener("change", handleFileChange);
    console.log("🔗 [PHOTO FIELD] Event listener attached to file input");

    return () => {
      input.removeEventListener("change", handleFileChange);
      console.log("🔌 [PHOTO FIELD] Event listener removed");
    };
  }, [uploadSingleImage, maxSizeMB, onPhotoUploaded]);

  const handleButtonClick = () => {
    console.log("🖱️ [PHOTO FIELD] Button clicked");
    if (inputRef.current && !disabled && !isUploading) {
      console.log("✅ [PHOTO FIELD] Triggering file input click");
      inputRef.current.click();
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled || isUploading}
      />
      <Button
        onClick={handleButtonClick}
        disabled={disabled || isUploading}
        variant="outline"
        size="sm"
        className="w-full"
      >
        {isUploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            {label}
          </>
        )}
      </Button>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
