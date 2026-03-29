import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Camera, Loader2 } from "lucide-react";

interface PhotoUploadButtonProps {
  onFilesSelected: (files: FileList) => void;
  accept?: string;
  multiple?: boolean;
  capture?: boolean | "user" | "environment";
  isLoading?: boolean;
  variant?: "default" | "outline" | "destructive" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  icon?: "upload" | "camera";
  label: string;
  disabled?: boolean;
}

export default function PhotoUploadButton({
  onFilesSelected,
  accept = "image/*",
  multiple = false,
  capture = false,
  isLoading = false,
  variant = "outline",
  size = "sm",
  icon = "upload",
  label,
  disabled = false,
}: PhotoUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    if (inputRef.current && !disabled && !isLoading) {
      inputRef.current.click();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
      // Reset input so same file can be selected again
      e.target.value = "";
    }
  };

  const IconComponent = icon === "camera" ? Camera : Upload;

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        capture={capture || undefined}
        onChange={handleChange}
        className="hidden"
        disabled={disabled || isLoading}
      />
      <Button
        size={size}
        variant={variant}
        onClick={handleButtonClick}
        disabled={disabled || isLoading}
        type="button"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
        ) : (
          <IconComponent className="w-4 h-4 mr-1" />
        )}
        {label}
      </Button>
    </>
  );
}
