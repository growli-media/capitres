"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import Modal from "./Modal";
import { glassButtonPrimary, glassButtonSecondary } from "../../glass";

const ASPECT_OPTIONS = [
  { label: "Freeform", value: undefined },
  { label: "Square", value: 1 },
  { label: "Portrait 4:5", value: 4 / 5 },
  { label: "Landscape 16:9", value: 16 / 9 },
] as const;

/** A centered crop covering 90% of the image — aspect-locked if given
 * one, otherwise a plain freeform rectangle at the same size. */
function centeredCropFor(
  aspect: number | undefined,
  width: number,
  height: number,
): PixelCrop {
  if (aspect) {
    return centerCrop(
      makeAspectCrop({ unit: "px", width: width * 0.9 }, aspect, width, height),
      width,
      height,
    );
  }
  const w = width * 0.9;
  const h = height * 0.9;
  return { unit: "px", x: (width - w) / 2, y: (height - h) / 2, width: w, height: h };
}

function cropToBlob(
  image: HTMLImageElement,
  area: { x: number; y: number; width: number; height: number },
  outputType: string,
  quality?: number,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(area.width);
  canvas.height = Math.round(area.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Cropping isn't supported in this browser.");
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Couldn't process that crop."))),
      outputType,
      quality,
    );
  });
}

/**
 * Crop step between picking a photo and uploading it — drag out or resize
 * a crop box directly on the image (react-image-crop), locked to a preset
 * aspect or left freeform. Renders nothing until a file is handed in; the
 * caller owns that state (open = file !== null) so one instance can serve
 * every photo row in a form instead of a modal per row.
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
  const [aspect, setAspect] = useState<number | undefined>(defaultAspect);
  const [crop, setCrop] = useState<PixelCrop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Deliberately never revoked: a cleanup effect that revokes it would
  // fire for real on Strict Mode's dev-only double-invoke (mount →
  // cleanup → mount), permanently breaking the image after the first
  // remount. This editor only ever holds one or two of these per form
  // session — the browser releases them anyway once the tab navigates
  // away — so the tradeoff favours not fighting Strict Mode over it.
  const objectUrl = useMemo(() => URL.createObjectURL(file), [file]);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const next = centeredCropFor(aspect, width, height);
    setCrop(next);
    setCompletedCrop(next);
  }

  function handleAspectChange(next: number | undefined) {
    setAspect(next);
    const img = imgRef.current;
    if (!img) return;
    const c = centeredCropFor(next, img.width, img.height);
    setCrop(c);
    setCompletedCrop(c);
  }

  const handleApply = useCallback(async () => {
    const img = imgRef.current;
    if (!img || !completedCrop || completedCrop.width === 0 || completedCrop.height === 0) return;
    setApplying(true);
    setError(null);
    try {
      const scaleX = img.naturalWidth / img.width;
      const scaleY = img.naturalHeight / img.height;
      const area = {
        x: completedCrop.x * scaleX,
        y: completedCrop.y * scaleY,
        width: completedCrop.width * scaleX,
        height: completedCrop.height * scaleY,
      };
      const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
      const blob = await cropToBlob(
        img,
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
  }, [file, completedCrop, onApply]);

  return (
    <div className="space-y-4">
      <div className="flex max-h-[60vh] items-center justify-center overflow-auto rounded-lg bg-slate-900 p-2">
        <ReactCrop
          crop={crop}
          aspect={aspect}
          ruleOfThirds
          onChange={(pixelCrop) => setCrop(pixelCrop)}
          onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- a
              local blob: URL, not a remote image next/image can optimize */}
          <img
            ref={imgRef}
            src={objectUrl}
            alt=""
            onLoad={onImageLoad}
            className="max-h-[56vh] max-w-full"
          />
        </ReactCrop>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {ASPECT_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => handleAspectChange(opt.value)}
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
          disabled={applying || !completedCrop}
          className={`h-10 cursor-pointer px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${glassButtonPrimary}`}
        >
          {applying ? "Applying…" : "Apply & upload"}
        </button>
      </div>
    </div>
  );
}
