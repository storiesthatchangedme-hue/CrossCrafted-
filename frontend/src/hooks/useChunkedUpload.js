import { useState, useRef, useCallback } from 'react';
import api, { uploadConfig } from '@/lib/api';

const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunks

export function useChunkedUpload() {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const abortRef = useRef(false);

  const upload = useCallback(async (file) => {
    setUploading(true);
    setProgress(0);
    abortRef.current = false;

    const isLargeFile = file.size > CHUNK_SIZE;

    try {
      if (!isLargeFile) {
        // Small file: direct upload
        const fd = new FormData();
        fd.append('file', file);
        const { data } = await api.post('/api/upload', fd, uploadConfig({
          onUploadProgress: (e) => {
            if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
          },
        }));
        setProgress(100);
        return data;
      }

      // Large file: chunked upload
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

      // 1. Init
      const { data: initData } = await api.post(
        '/api/upload/init',
        { filename: file.name, content_type: file.type, total_size: file.size, total_chunks: totalChunks }
      );
      const uploadId = initData.upload_id;

      // 2. Upload chunks
      for (let i = 0; i < totalChunks; i++) {
        if (abortRef.current) throw new Error('Upload cancelled');
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);
        const fd = new FormData();
        fd.append('chunk_index', i.toString());
        fd.append('file', chunk, `chunk_${i}`);

        await api.post(`/api/upload/chunk/${uploadId}`, fd, uploadConfig());
        setProgress(Math.round(((i + 1) / totalChunks) * 90)); // 0-90% for chunks
      }

      // 3. Finalize
      const { data: finalData } = await api.post(
        `/api/upload/finalize/${uploadId}`,
        {}
      );
      setProgress(100);
      return finalData;
    } finally {
      setUploading(false);
    }
  }, []);

  const cancel = useCallback(() => { abortRef.current = true; }, []);

  return { upload, progress, uploading, cancel };
}
