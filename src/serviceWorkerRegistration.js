navigator.serviceWorker.ready.then((swRegistration) => {
  if ('sync' in swRegistration) {
    swRegistration.sync.register('sync-annotations')
      .then(() => console.log("Background sync registered"))
      .catch(err => console.error("Background sync failed", err));
  }
});
