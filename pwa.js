if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./sw.js");
    } catch (_error) {
      // Ignore registration failures in unsupported contexts.
    }
  });
}
