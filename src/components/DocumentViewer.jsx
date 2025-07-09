import { useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import '../pdfWorker';

const DocumentViewer = ({ file, pageNumber = 1, onPageLoad }) => {
  const canvasRef = useRef();
  const renderTaskRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const renderPDFPage = async () => {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {
          console.warn("Failed to cancel previous render task", e);
        }
      }

      let loadingTask;
      if (file instanceof File) {
        loadingTask = pdfjsLib.getDocument({ data: await file.arrayBuffer() });
      } else {
        loadingTask = pdfjsLib.getDocument(file);
      }
      const pdf = await loadingTask.promise;

      if (cancelled) return;

      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.5 });

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      context.clearRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;

      try {
        await renderTask.promise;
        if (!cancelled && onPageLoad) {
          onPageLoad();
        }
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error("Render error:", err);
        }
      }
    };

    renderPDFPage();

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [file, pageNumber, onPageLoad]);

  return <canvas ref={canvasRef} />;
};

export default DocumentViewer;
