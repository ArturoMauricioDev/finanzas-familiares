process.env.NEXT_PUBLIC_API_URL = "http://localhost:8000";
import "@testing-library/jest-dom";

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

if (!navigator.geolocation) {
  Object.defineProperty(navigator, "geolocation", {
    writable: true,
    value: {
      getCurrentPosition: (
        _success: PositionCallback,
        error?: PositionErrorCallback | null,
      ) => error?.(null as unknown as GeolocationPositionError),
    },
  });
}
