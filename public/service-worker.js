self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-annotations') {
    event.waitUntil(syncAnnotations());
  }
});

async function syncAnnotations() {
  const data = await getOfflineAnnotations(); // Load from IndexedDB or Cache
  await sendToServer(data); // POST to backend
}
