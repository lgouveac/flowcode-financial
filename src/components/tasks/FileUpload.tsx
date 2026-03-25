import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Image, Video, File } from "lucide-react";

interface FileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  accept?: string;
}

export function FileUpload({
  files,
  onFilesChange,
  maxFiles = 5,
  accept = "image/*,video/*",
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const remaining = maxFiles - files.length;
    const toAdd = Array.from(newFiles).slice(0, remaining);
    onFilesChange([...files, ...toAdd]);
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <Image className="h-4 w-4" />;
    if (file.type.startsWith("video/")) return <Video className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const getPreview = (file: File) => {
    if (file.type.startsWith("image/")) {
      return (
        <img
          src={URL.createObjectURL(file)}
          alt={file.name}
          className="h-16 w-16 object-cover rounded"
        />
      );
    }
    if (file.type.startsWith("video/")) {
      return (
        <video
          src={URL.createObjectURL(file)}
          className="h-16 w-16 object-cover rounded"
          muted
        />
      );
    }
    return (
      <div className="h-16 w-16 flex items-center justify-center bg-muted rounded">
        <File className="h-6 w-6 text-muted-foreground" />
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Arraste arquivos aqui ou clique para selecionar
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Imagens e vídeos (máx. {maxFiles} arquivos)
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="relative group border rounded-lg p-1"
            >
              {getPreview(file)}
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
              <p className="text-[10px] text-muted-foreground truncate max-w-[64px] mt-1">
                {file.name}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
