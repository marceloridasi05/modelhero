import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, AlertCircle } from "lucide-react";
import { useKitImageUpload } from "@/hooks/use-kit-image-upload";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CameraPhotoUploadProps {
  onPhotoUploaded: (photo: { id: string; name: string; url: string; type: "image"; thumbnail?: string }) => void;
  label?: string;
  disabled?: boolean;
}

export default function CameraPhotoUpload({
  onPhotoUploaded,
  label = "Take Photo",
  disabled = false,
}: CameraPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { uploadSingleImage } = useKitImageUpload({
    onError: (err) => {
      setError(err.message);
      setIsUploading(false);
    },
  });

  // Attach vanilla event listener for camera capture
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const handleFileChange = async (e: Event) => {
      const fileInput = e.target as HTMLInputElement;
      if (!fileInput.files || fileInput.files.length === 0) return;

      const file = fileInput.files[0];

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Invalid file type");
        fileInput.value = "";
        return;
      }

      setError(null);
      setIsUploading(true);

      try {
        console.log("📷 [CAMERA] Photo captured, starting auto-upload for file:", file.name);
        const uploadedPhoto = await uploadSingleImage(file);

        if (uploadedPhoto) {
          console.log("✅ [CAMERA] Photo uploaded successfully:", uploadedPhoto);
          onPhotoUploaded(uploadedPhoto);
        } else {
          setError("Upload failed. Please try again.");
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Upload failed";
        setError(errorMsg);
        console.error("❌ [CAMERA] Upload error:", err);
      } finally {
        setIsUploading(false);
        // Reset input so photo can be taken again
        fileInput.value = "";
      }
    };

    input.addEventListener("change", handleFileChange);
    console.log("🔗 [CAMERA] Event listener attached to camera input");

    return () => {
      input.removeEventListener("change", handleFileChange);
      console.log("🔌 [CAMERA] Event listener removed");
    };
  }, [uploadSingleImage, onPhotoUploaded]);

  const handleButtonClick = () => {
    console.log("🖱️ [CAMERA] Camera button clicked");
    if (inputRef.current && !disabled && !isUploading) {
      console.log("✅ [CAMERA] Triggering camera input click");
      inputRef.current.click();
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
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
            <Camera className="w-4 h-4 mr-2" />
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
