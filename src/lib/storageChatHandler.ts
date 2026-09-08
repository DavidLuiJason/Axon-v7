import { AssetManifestItem } from '../types';
import { AVAILABLE_DOWNLOADABLE_PACKS, formatBytes } from './storageManifest';

export function tryEvaluateMathExpression(query: string): string | null {
  const clean = query.trim().toLowerCase();
  // Strip question prefix like "what is", "calculate", "solve"
  const stripped = clean
    .replace(/^(?:what\s+is|calc|calculate|evaluate|solve)\s+/i, '')
    .replace(/[?=]/g, '')
    .trim();

  // Check if purely arithmetic characters e.g. 50 * 4, 12 + 34, 15% of 80, sqrt(16)
  const percentMatch = stripped.match(/^(\d+(?:\.\d+)?)\s*%\s*(?:of)?\s*(\d+(?:\.\d+)?)$/);
  if (percentMatch) {
    const pct = parseFloat(percentMatch[1]);
    const total = parseFloat(percentMatch[2]);
    const res = (pct / 100) * total;
    return `${pct}% of ${total} = ${res}`;
  }

  // Safe arithmetic evaluation
  if (/^[-+*/()0-9.\s^]+$/.test(stripped) && /\d/.test(stripped)) {
    try {
      const sanitized = stripped.replace(/\^/g, '**');
      // eslint-disable-next-line no-new-func
      const result = Function(`'use strict'; return (${sanitized})`)();
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        return `${stripped} = ${Number(result.toFixed(6)).toString()}`;
      }
    } catch {
      return null;
    }
  }

  return null;
}

export function handleStorageChatCommand(
  text: string,
  assetManifest: AssetManifestItem[],
  reallocateAssetSpace: (assetId: string, bytesToFree: number) => { success: boolean; message: string },
  addDownloadablePack: (pack: any) => void
): string | null {
  const norm = text.trim().toLowerCase();

  // Reallocate command: e.g. "reallocate 500MB from gemini", "free 1GB from python"
  const reallocMatch = norm.match(/(?:reallocate|free|transfer)\s+(\d+(?:\.\d+)?)\s*(mb|gb|kb)?\s+from\s+(.+)/i);
  if (reallocMatch) {
    const amountNum = parseFloat(reallocMatch[1]);
    const unit = (reallocMatch[2] || 'mb').toLowerCase();
    const targetQuery = reallocMatch[3].trim().toLowerCase();

    let bytes = amountNum * 1024 * 1024;
    if (unit === 'gb') bytes = amountNum * 1024 * 1024 * 1024;
    if (unit === 'kb') bytes = amountNum * 1024;

    const matchedAsset = assetManifest.find(
      (a) => a.name.toLowerCase().includes(targetQuery) || a.id.toLowerCase().includes(targetQuery)
    );

    if (matchedAsset) {
      const res = reallocateAssetSpace(matchedAsset.id, bytes);
      return res.message;
    } else {
      return `Could not find an asset in the manifest matching "${targetQuery}". Available assets: ${assetManifest.map((a) => a.name).join(', ')}`;
    }
  }

  // Download pack command: e.g. "download esv study pack", "install speech pack"
  if (norm.includes('download') || norm.includes('install pack')) {
    for (const pack of AVAILABLE_DOWNLOADABLE_PACKS) {
      if (norm.includes(pack.name.toLowerCase()) || norm.includes(pack.id.toLowerCase()) || (pack.id.includes('bible') && norm.includes('bible'))) {
        addDownloadablePack(pack);
        return `Downloaded and registered "${pack.name}" (${formatBytes(pack.sizeBytes)}) into local storage.`;
      }
    }
  }

  // Storage breakdown query: e.g. "storage status", "how much space", "storage breakdown"
  if (
    norm === 'storage' ||
    norm.includes('how much space') ||
    norm.includes('storage status') ||
    norm.includes('storage breakdown') ||
    norm.includes('disk usage')
  ) {
    const totalBytes = assetManifest.reduce((acc, curr) => acc + curr.storedSizeBytes, 0);
    const count = assetManifest.length;
    return `Storage Status: Currently utilizing ${formatBytes(totalBytes)} across ${count} registered assets in the manifest. You can open Storage Diagnostics from the menu to optimize or adjust budgets.`;
  }

  return null;
}
