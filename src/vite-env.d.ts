/// <reference types="vite/client" />

declare global {
	interface Window {
		dataLayer: unknown[];
	}

	const gtag: (...args: unknown[]) => void;
}

export {};
