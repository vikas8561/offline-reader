import { useEffect, useState } from 'react';

export default function useBlobUrl(file) {
  const [blobUrl, setBlobUrl] = useState(null);

  useEffect(() => {
    if (!file) {
      setBlobUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setBlobUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return blobUrl;
} 