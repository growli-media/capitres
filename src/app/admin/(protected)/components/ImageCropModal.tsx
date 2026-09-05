"use client";

import { useCallback, useMemo, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import Modal from "./Modal";
import { glassButtonPrimary, glassButtonSecondary } from "../../glass";

const ASPECT_OPTIONS = [
  { label: "Square", value: 1 },
  { label: "Portrait 4:5", value: 4 / 5 },
  { label: "Landscape 16:9", value: 16 / 9 },
] as const;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Couldn't read that image."));
    img.src = src;
  });
}

async function cropToBlob(
  src: string,
  area: Area,
  outputType: string,
  quality?: number,
): Promise<Blob> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(area.width);
  canvas.height = Math.round(area.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Cropping isn't supported in this browser.");
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Couldn't process that crop."))),
      outputType,
      quality,
    );
  });
}

/**
 * Crop step between picking a photo and uploading it. Pan/zoom within a
 * locked aspect box — react-easy-crop's own interaction model, not a
 * draggable resizable frame — so "aspect" below is a preset picker rather
 * than freeform. Renders nothing until a file is handed in; the caller
 * owns that state (open = file !== null) so one instance can serve every
 * photo row in a form instead of a modal per row.
 *
 * The editor below is keyed by the file's identity rather than resetting
 * its crop/zoom state in an effect when `file` changes — remounting on a
 * new file gives it fresh initial state for free and is the pattern React
 * itself recommends over an effect that exists purely to reset state.
 */
export default function ImageCropModal({
  file,
  defaultAspect,
  onApply,
  onCancel,
}: {
  file: File | null;
  defaultAspect: number;
  onApply: (blob: Blob, filename: string) => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={!!file} onClose={onCancel} title="Crop photo" size="lg">
      {file && (
        <CropEditor
          key={`${file.name}-${file.size}-${file.lastModified}`}
          file={file}
          defaultAspect={defaultAspect}
          onApply={onApply}
          onCancel={onCancel}
        />
      )}
    </Modal>
  );
}

function CropEditor({
  file,
  defaultAspect,
  onApply,
  onCancel,
}: {
  file: File;
  defaultAspect: number;
  onApply: (blob: Blob, filename: string) => void;
  onCancel: () => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(defaultAspect);
  const [area, setArea] = useState<Area | null>(null);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Deliberately never revoked: a cleanup effect that revokes it would
  // fire for real on Strict Mode's dev-only double-invoke (mount →
  // cleanup → mount), permanently breaking the image after the first
  // remount. This editor only ever holds one or two of these per form
  // session — the browser releases them anyway once the tab navigates
  // away — so the tradeoff favours not fighting Strict Mode over it.
  const objectUrl = useMemo(() => URL.createObjectURL(file), [file]);

  const handleApply = useCallback(async () => {
    if (!area) return;
    setApplying(true);
    setError(null);
    try {
      const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
      const blob = await cropToBlob(
        objectUrl,
        area,
        outputType,
        outputType === "image/jpeg" ? 0.9 : undefined,
      );
      const ext = outputType === "image/png" ? "png" : "jpg";
      onApply(blob, `photo.${ext}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't process that crop.");
    } finally {
      setApplying(false);
    }
  }, [file, objectUrl, area, onApply]);

  return (
    <div className="space-y-4">
      <div className="relative h-96 w-full overflow-hidden rounded-lg bg-slate-900">
        <Cropper
          image={objectUrl}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_, pixels) => setArea(pixels)}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-1.5">
          {ASPECT_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => setAspect(opt.value)}
              className={`h-8 cursor-pointer rounded-full border px-3 text-xs font-medium transition-colors ${
                aspect === opt.value
                  ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                  : "border-slate-300 text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          Zoom
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-32 cursor-pointer accent-slate-900 dark:accent-slate-100"
          />
        </label>
      </div>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className={`h-10 cursor-pointer px-4 text-sm font-medium text-slate-700 dark:text-slate-300 ${glassButtonSecondary}`}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleApply}
          disabled={applying || !area}
          className={`h-10 cursor-pointer px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${glassButtonPrimary}`}
        >
          {applying ? "Applying…" : "Apply & upload"}
        </button>
      </div>
    </div>
  );
}
