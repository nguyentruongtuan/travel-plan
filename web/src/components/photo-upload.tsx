import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

const MAX_BYTES = 10 * 1024 * 1024;

export function PhotoUpload({ value, onChange }: { value: string | null; onChange: (url: string | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file.");
    if (file.size > MAX_BYTES) return toast.error("Image must be 10 MB or smaller.");
    setUploading(true);
    try {
      const { url } = await api.uploadPhoto(file);
      onChange(url);
    } catch (err) {
      toast.error(`Upload failed: ${(err as Error).message}`);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      {value ? (
        <div className="relative overflow-hidden rounded-lg border">
          <img src={value} alt="" className="aspect-video w-full object-cover" />
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute top-2 right-2 size-8 rounded-full"
            aria-label="Remove photo"
            onClick={() => onChange(null)}
          >
            <X />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="text-muted-foreground hover:bg-accent flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-sm transition-colors"
        >
          {uploading ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
          {uploading ? "Uploading…" : "Add a photo"}
        </button>
      )}
    </div>
  );
}
