"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AttachmentItem = {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  created_at: string;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string): string {
  if (type.startsWith("image/")) return "🖼";
  if (type === "application/pdf") return "📄";
  if (type.includes("spreadsheet") || type.includes("excel")) return "📊";
  if (type.includes("word") || type.includes("document")) return "📝";
  return "📎";
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function AttachmentsPanel({
  caseId,
  organisationId,
  attachments,
}: {
  caseId: string;
  organisationId: string;
  attachments: AttachmentItem[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function uploadFiles(files: FileList | File[]) {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    for (const file of fileArray) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`${file.name} exceeds 10MB limit`);
        return;
      }
    }

    setError(null);
    setUploading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated");
      setUploading(false);
      return;
    }

    for (const file of fileArray) {
      const ext = file.name.split(".").pop() ?? "";
      const storagePath = `${organisationId}/${caseId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(storagePath, file);

      if (uploadError) {
        setError(`Failed to upload ${file.name}: ${uploadError.message}`);
        setUploading(false);
        return;
      }

      const { error: dbError } = await supabase.from("attachments").insert({
        case_id: caseId,
        organisation_id: organisationId,
        file_name: file.name,
        file_type: file.type || "application/octet-stream",
        file_size: file.size,
        storage_path: storagePath,
        uploaded_by: user.id,
      });

      if (dbError) {
        setError(`Failed to save ${file.name}: ${dbError.message}`);
        setUploading(false);
        return;
      }
    }

    setUploading(false);
    router.refresh();
  }

  async function handleDownload(attachment: AttachmentItem) {
    const supabase = createClient();
    const { data, error: dlError } = await supabase.storage
      .from("attachments")
      .createSignedUrl(attachment.storage_path, 60);

    if (dlError || !data?.signedUrl) {
      setError("Failed to generate download link");
      return;
    }

    window.open(data.signedUrl, "_blank");
  }

  async function handleDelete(attachment: AttachmentItem) {
    const supabase = createClient();

    const { error: storageErr } = await supabase.storage
      .from("attachments")
      .remove([attachment.storage_path]);

    if (storageErr) {
      setError(`Failed to delete file: ${storageErr.message}`);
      return;
    }

    await supabase.from("attachments").delete().eq("id", attachment.id);
    router.refresh();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  }

  return (
    <div className="bg-surface border border-border rounded-[10px] p-5">
      <h2 className="text-sm font-semibold mb-3">Attachments</h2>

      {error && (
        <div className="bg-red/10 border border-red/20 text-red text-[12px] px-3 py-2 rounded-lg mb-3">
          {error}
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors mb-3 ${
          dragOver
            ? "border-accent bg-accent/5"
            : "border-border hover:border-border-strong"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) uploadFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <p className="text-text-tertiary text-[12px] mb-1">
          {uploading ? "Uploading..." : "Drag files here or"}
        </p>
        {!uploading && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-accent text-[12px] font-medium hover:underline"
          >
            browse files
          </button>
        )}
        <p className="text-text-tertiary text-[11px] mt-1">Max 10MB per file</p>
      </div>

      {attachments.length === 0 ? (
        <p className="text-text-tertiary text-[12px]">No attachments yet</p>
      ) : (
        <div className="space-y-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-2.5 text-[13px] group"
            >
              <span className="text-[14px] shrink-0">
                {getFileIcon(att.file_type)}
              </span>
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => handleDownload(att)}
                  className="text-left font-medium hover:text-accent truncate block w-full"
                  title={att.file_name}
                >
                  {att.file_name}
                </button>
                <span className="text-text-tertiary text-[11px]">
                  {formatFileSize(att.file_size)}
                </span>
              </div>
              <button
                onClick={() => handleDelete(att)}
                className="text-text-tertiary hover:text-red text-[12px] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                title="Delete"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
