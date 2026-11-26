import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

const MAX_BYTES = 520_000;
const MAX_DIMENSION = 1280;

const mediaCache = new Map<string, string>();
const inflightReads = new Map<string, Promise<string | null>>();

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read the selected image file.'));
    };
    img.src = objectUrl;
  });
}

export async function compressImageFile(file: File): Promise<{
  dataUrl: string;
  mimeType: 'image/webp' | 'image/jpeg';
  sizeBytes: number;
}> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose a valid image file (JPG, PNG, or WebP).');
  }
  if (file.size > 20 * 1024 * 1024) {
    throw new Error('Image file is too large (max 20 MB).');
  }

  const img = await loadImageElement(file);
  let { width, height } = img;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    width = Math.max(1, Math.round(width * ratio));
    height = Math.max(1, Math.round(height * ratio));
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Image processing is not supported in this browser.');
  }
  ctx.drawImage(img, 0, 0, width, height);

  let mimeType: 'image/webp' | 'image/jpeg' = 'image/webp';
  let dataUrl = canvas.toDataURL(mimeType, 0.82);
  if (!dataUrl.startsWith('data:image/webp')) {
    mimeType = 'image/jpeg';
    dataUrl = canvas.toDataURL(mimeType, 0.82);
  }

  let quality = 0.72;
  while (dataUrl.length > MAX_BYTES && quality >= 0.35) {
    dataUrl = canvas.toDataURL(mimeType, quality);
    quality -= 0.12;
  }

  if (dataUrl.length > 740_000) {
    const scale = 0.7;
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    dataUrl = canvas.toDataURL('image/jpeg', 0.72);
    mimeType = 'image/jpeg';
  }

  const approxBytes = Math.max(1, Math.round((dataUrl.length * 3) / 4));
  if (approxBytes > 590_000 || dataUrl.length > 745_000) {
    throw new Error('Image could not be compressed small enough. Please select a smaller photo.');
  }

  return { dataUrl, mimeType, sizeBytes: approxBytes };
}

function generateMediaId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `med_${Date.now().toString(36)}_${rand}`;
}

export async function uploadImageAsset(
  userId: string,
  file: File,
  tripId = ''
): Promise<string> {
  const { dataUrl, mimeType, sizeBytes } = await compressImageFile(file);
  const mediaId = generateMediaId();
  const path = `media/${mediaId}`;

  try {
    await setDoc(doc(db, 'media', mediaId), {
      userId,
      tripId,
      dataUrl,
      mimeType,
      sizeBytes,
      createdAt: serverTimestamp(),
    });
    const ref = `media:${mediaId}`;
    mediaCache.set(ref, dataUrl);
    return ref;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function resolveMediaUrl(ref: string): Promise<string | null> {
  if (!ref) return null;
  if (!ref.startsWith('media:')) return ref;

  const cached = mediaCache.get(ref);
  if (cached) return cached;

  const existingPromise = inflightReads.get(ref);
  if (existingPromise) return existingPromise;

  const mediaId = ref.slice('media:'.length);
  const path = `media/${mediaId}`;

  const promise = (async () => {
    try {
      const snap = await getDoc(doc(db, 'media', mediaId));
      if (!snap.exists()) return null;
      const dataUrl = snap.data().dataUrl as string | undefined;
      if (dataUrl) {
        mediaCache.set(ref, dataUrl);
        return dataUrl;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    } finally {
      inflightReads.delete(ref);
    }
  })();

  inflightReads.set(ref, promise);
  return promise;
}

export async function deleteMediaAsset(ref: string): Promise<void> {
  if (!ref || !ref.startsWith('media:')) return;
  const mediaId = ref.slice('media:'.length);
  mediaCache.delete(ref);
  const path = `media/${mediaId}`;
  try {
    await deleteDoc(doc(db, 'media', mediaId));
  } catch (error) {
    console.warn('Could not remove media asset:', path, error);
  }
}
