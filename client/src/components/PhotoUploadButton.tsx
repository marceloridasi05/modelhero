import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Camera, Loader2 } from "lucide-react";

interface PhotoUploadButtonProps {
  onFileSelect: (files: FileList) => void;
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
  onFileSelect,
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
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (inputRef.current && !disabled && !isLoading) {
      console.log("[PhotoUploadButton] Clicking input ref");
      inputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("[PhotoUploadButton] Files selected:", e.target.files?.length);
    if (e.target.files) {
      onFileSelect(e.target.files);
    }
  };

  const inputProps: React.InputHTMLAttributes<HTMLInputElement> = {
    ref: inputRef,
    type: "file",
    accept,
    multiple,
    onChange: handleFileChange,
    style: { display: "none" },
    disabled,
  };

  if (capture) {
    inputProps.capture = capture;
  }

  const IconComponent = icon === "camera" ? Camera : Upload;

  return (
    <div
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <input {...inputProps} />
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
    </div>
  );
}
