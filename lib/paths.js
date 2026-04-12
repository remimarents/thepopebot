/**
 * Central path resolver for thepopebot.
 * Resolves to the actual project root (parent of web/).
 * Falls back to process.cwd() if THEPOPEBOT_ROOT is not set.
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to resolve upward to find the project root
// __dirname is lib/, so we go up to project root
const projectRootGuess = path.resolve(__dirname, '..');

// Check if this looks like a project root (has web/, api/, lib/)
import fs from 'fs';
function isProjectRoot(dir) {
  return fs.existsSync(path.join(dir, 'web')) && 
         fs.existsSync(path.join(dir, 'api')) &&
         fs.existsSync(path.join(dir, 'lib'));
}

let resolvedRoot = projectRootGuess;
if (!isProjectRoot(resolvedRoot)) {
  // Try parent directory (in case we're in a monorepo)
  const parentRoot = path.resolve(resolvedRoot, '..');
  if (isProjectRoot(parentRoot)) {
    resolvedRoot = parentRoot;
  }
}

export const PROJECT_ROOT = process.env.THEPOPEBOT_ROOT || resolvedRoot;
