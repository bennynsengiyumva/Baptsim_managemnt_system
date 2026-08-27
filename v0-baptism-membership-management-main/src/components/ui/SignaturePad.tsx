import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pen, Upload, Trash2, Check, RotateCcw } from 'lucide-react';

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onClear?: () => void;
  existingSignature?: string | null;
  width?: number;
  height?: number;
}

export default function SignaturePad({
  onSave,
  onClear,
  existingSignature,
  width = 500,
  height = 200,
}: SignaturePadProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [mode, setMode] = useState<'draw' | 'upload'>('draw');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    if (existingSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        setHasDrawn(true);
      };
      img.src = existingSignature;
    }
  }, [existingSignature, width, height]);

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e293b';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    setHasDrawn(false);
    setUploadedImage(null);
    onClear?.();
  };

  const handleSave = () => {
    if (mode === 'upload' && uploadedImage) {
      onSave(uploadedImage);
    } else if (mode === 'draw' && canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onSave(dataUrl);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setUploadedImage(result);
      setHasDrawn(true);

      // Also draw on canvas for preview
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        const scale = Math.min(width / img.width, height / img.height);
        const x = (width - img.width * scale) / 2;
        const y = (height - img.height * scale) / 2;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      {/* Mode Tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('draw')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'draw'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Pen size={16} />
          {t('signature.draw', 'Draw')}
        </button>
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'upload'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Upload size={16} />
          {t('signature.upload', 'Upload')}
        </button>
      </div>

      {/* Canvas */}
      <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          className={`w-full ${mode === 'draw' ? 'cursor-crosshair' : 'cursor-default'}`}
          style={{ height }}
          onMouseDown={mode === 'draw' ? startDrawing : undefined}
          onMouseMove={mode === 'draw' ? draw : undefined}
          onMouseUp={mode === 'draw' ? stopDrawing : undefined}
          onMouseLeave={mode === 'draw' ? stopDrawing : undefined}
          onTouchStart={mode === 'draw' ? startDrawing : undefined}
          onTouchMove={mode === 'draw' ? draw : undefined}
          onTouchEnd={mode === 'draw' ? stopDrawing : undefined}
        />
        {mode === 'draw' && !hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-slate-400 dark:text-slate-500 text-sm">
              {t('signature.drawHere', 'Draw your signature here')}
            </p>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Actions */}
      <div className="flex gap-3">
        {mode === 'upload' && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 transition-colors text-sm"
          >
            <Upload size={16} />
            {t('signature.chooseImage', 'Choose Image')}
          </button>
        )}
        <button
          type="button"
          onClick={clearCanvas}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 transition-colors text-sm"
        >
          <RotateCcw size={16} />
          {t('common.clear', 'Clear')}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasDrawn}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check size={16} />
          {t('signature.saveSignature', 'Save Signature')}
        </button>
      </div>
    </div>
  );
}
