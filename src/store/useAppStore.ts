import { create } from 'zustand';

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  progress: number;
  processedUrl?: string;
}

interface WatermarkSettings {
  text: string;
  fontSize: number;
  fontStyle: string;
  color: string;
  opacity: number;
  rotation: number;
  position: 'top-left' | 'top-right' | 'center' | 'bottom-left' | 'bottom-right' | 'custom';
  customX: number;
  customY: number;
  logoFile?: File;
  logoPreview?: string;
}

interface AppState {
  watermarkImages: ImageFile[];
  removalImages: ImageFile[];
  settings: WatermarkSettings;
  isProcessing: boolean;
  addImages: (files: File[], type: 'watermark' | 'removal') => void;
  removeImage: (id: string, type: 'watermark' | 'removal') => void;
  updateSettings: (settings: Partial<WatermarkSettings>) => void;
  clearImages: (type: 'watermark' | 'removal') => void;
}

export const useAppStore = create<AppState>((set) => ({
  watermarkImages: [],
  removalImages: [],
  settings: {
    text: 'CONFIDENTIAL',
    fontSize: 48,
    fontStyle: 'Inter',
    color: '#ffffff',
    opacity: 0.5,
    rotation: 0,
    position: 'center',
    customX: 50,
    customY: 50,
  },
  isProcessing: false,
  addImages: (files, type) => set((state) => {
    const newImages = files.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
      status: 'idle' as const,
      progress: 0,
    }));
    return type === 'watermark' 
      ? { watermarkImages: [...state.watermarkImages, ...newImages] }
      : { removalImages: [...state.removalImages, ...newImages] };
  }),
  removeImage: (id, type) => set((state) => {
    return type === 'watermark'
      ? { watermarkImages: state.watermarkImages.filter((img) => img.id !== id) }
      : { removalImages: state.removalImages.filter((img) => img.id !== id) };
  }),
  updateSettings: (newSettings) => set((state) => ({
    settings: { ...state.settings, ...newSettings },
  })),
  clearImages: (type) => set((state) => {
    return type === 'watermark'
      ? { watermarkImages: [] }
      : { removalImages: [] };
  }),
}));
