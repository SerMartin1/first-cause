/// <reference types="vite/client" />

// Pixi's side-effect-only CSP polyfill has no type export in its package map.
declare module "pixi.js/unsafe-eval" {}
