import {
  AssetCategory,
  AssetManifestItem,
  SaveMode,
  StorageBudgetConfig,
  TrimCategoryPriority,
} from '../types';

export interface StorageBreakdown {
  totalStoredBytes: number;
  totalOriginalBytes: number;
  totalAllocatedBytes: number;
  totalSavedBytes: number;
  totalSavingsPercent: number;
  categoryTotals: Record<AssetCategory, number>;
  categoryOriginalTotals: Record<AssetCategory, number>;
  itemCounts: Record<AssetCategory, number>;
  staleKnowledgeCount: number;
  archiveCount: number;
  spaceSaverCount: number;
}

export const DEFAULT_STORAGE_BUDGET_CONFIG: StorageBudgetConfig = {
  budgetBytes: 15 * 1024 * 1024 * 1024, // 15 GB
  budgetMode: 'preset_15gb',
  trimPriority: [
    'cache',
    'stale_knowledge',
    'downsampled_user_files',
    'chat_history',
    'knowledge_packs',
    'models',
  ],
  warningThresholdPercent: 85,
  autoTrimOnBudgetNear: false,
  hasCompletedOnboarding: true,
};

export const DEFAULT_ASSET_MANIFEST: AssetManifestItem[] = [
  {
    id: 'asset-core-gemini',
    name: 'Gemini Multimodal Runtime Cache',
    category: 'model',
    storageLocation: '/system/models/gemini-runtime.bin',
    mimeType: 'application/octet-stream',
    originalSizeBytes: 1800 * 1024 * 1024,
    storedSizeBytes: 1250 * 1024 * 1024,
    allocatedSizeBytes: 2048 * 1024 * 1024,
    saveMode: 'archive',
    isOriginalPreserved: true,
    qualityState: 'original',
    knowledgeStatus: 'current',
    isCore: true,
    isEnabled: true,
    description: 'Core runtime model and instruction weights for AXON intelligent assistant.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastAccessedAt: new Date().toISOString(),
  },
  {
    id: 'asset-core-python-stdlib',
    name: 'Python WebAssembly StdLib',
    category: 'system',
    storageLocation: '/system/wasm/python-stdlib.bin',
    mimeType: 'application/wasm',
    originalSizeBytes: 42 * 1024 * 1024,
    storedSizeBytes: 18 * 1024 * 1024,
    allocatedSizeBytes: 50 * 1024 * 1024,
    saveMode: 'archive',
    isOriginalPreserved: true,
    qualityState: 'lossless',
    knowledgeStatus: 'current',
    isCore: true,
    isEnabled: true,
    description: 'Pyodide WebAssembly runtime for client-side Python execution.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastAccessedAt: new Date().toISOString(),
  },
  {
    id: 'asset-pack-bible-kjv',
    name: 'KJV Offline Scripture Reference',
    category: 'knowledge_pack',
    storageLocation: '/local/packs/kjv-offline.db',
    mimeType: 'application/x-sqlite3',
    originalSizeBytes: 28 * 1024 * 1024,
    storedSizeBytes: 12 * 1024 * 1024,
    allocatedSizeBytes: 30 * 1024 * 1024,
    saveMode: 'space_saver',
    isOriginalPreserved: false,
    qualityState: 'lossless',
    knowledgeStatus: 'current',
    isEnabled: true,
    description: 'Full searchable offline King James Version Bible text and indexing.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastAccessedAt: new Date().toISOString(),
  },
  {
    id: 'asset-pack-code-snippets',
    name: 'Developer Code Snippets & Syntax Index',
    category: 'knowledge_pack',
    storageLocation: '/local/packs/dev-snippets.json',
    mimeType: 'application/json',
    originalSizeBytes: 15 * 1024 * 1024,
    storedSizeBytes: 6 * 1024 * 1024,
    allocatedSizeBytes: 20 * 1024 * 1024,
    saveMode: 'space_saver',
    isOriginalPreserved: false,
    qualityState: 'lossless',
    knowledgeStatus: 'current',
    isEnabled: true,
    description: 'Offline syntax references and common algorithms.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastAccessedAt: new Date().toISOString(),
  },
];

export const AVAILABLE_DOWNLOADABLE_PACKS = [
  {
    id: 'pack-bible-esv',
    name: 'ESV Study Scripture Pack',
    sizeBytes: 32 * 1024 * 1024,
    category: 'knowledge_pack' as AssetCategory,
    description: 'English Standard Version with cross-references and concordance.',
  },
  {
    id: 'pack-offline-math',
    name: 'Advanced CAS & Scientific Math Pack',
    sizeBytes: 45 * 1024 * 1024,
    category: 'knowledge_pack' as AssetCategory,
    description: 'Symbolic mathematical formulas, matrix algorithms, and statistics engine.',
  },
  {
    id: 'pack-offline-speech',
    name: 'Phonetic Speech & WPM Acoustic Dictionary',
    sizeBytes: 60 * 1024 * 1024,
    category: 'knowledge_pack' as AssetCategory,
    description: 'Syllable breakdown library and speech pacing models.',
  },
];

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function calculateStorageBreakdown(items: AssetManifestItem[]): StorageBreakdown {
  const categoryTotals: Record<AssetCategory, number> = {
    model: 0,
    knowledge_pack: 0,
    user_file: 0,
    chat_history: 0,
    cache: 0,
    system: 0,
  };
  const categoryOriginalTotals: Record<AssetCategory, number> = {
    model: 0,
    knowledge_pack: 0,
    user_file: 0,
    chat_history: 0,
    cache: 0,
    system: 0,
  };
  const itemCounts: Record<AssetCategory, number> = {
    model: 0,
    knowledge_pack: 0,
    user_file: 0,
    chat_history: 0,
    cache: 0,
    system: 0,
  };

  let totalStoredBytes = 0;
  let totalOriginalBytes = 0;
  let totalAllocatedBytes = 0;
  let staleKnowledgeCount = 0;
  let archiveCount = 0;
  let spaceSaverCount = 0;

  for (const item of items) {
    const stored = item.storedSizeBytes || 0;
    const orig = item.originalSizeBytes || stored;
    const allocated = item.allocatedSizeBytes || stored;

    totalStoredBytes += stored;
    totalOriginalBytes += orig;
    totalAllocatedBytes += allocated;

    if (categoryTotals[item.category] !== undefined) {
      categoryTotals[item.category] += stored;
      categoryOriginalTotals[item.category] += orig;
      itemCounts[item.category] += 1;
    }

    if (item.knowledgeStatus === 'stale') {
      staleKnowledgeCount++;
    }
    if (item.saveMode === 'archive') {
      archiveCount++;
    } else {
      spaceSaverCount++;
    }
  }

  const totalSavedBytes = Math.max(0, totalOriginalBytes - totalStoredBytes);
  const totalSavingsPercent =
    totalOriginalBytes > 0 ? Math.round((totalSavedBytes / totalOriginalBytes) * 100) : 0;

  return {
    totalStoredBytes,
    totalOriginalBytes,
    totalAllocatedBytes,
    totalSavedBytes,
    totalSavingsPercent,
    categoryTotals,
    categoryOriginalTotals,
    itemCounts,
    staleKnowledgeCount,
    archiveCount,
    spaceSaverCount,
  };
}

export function changeAssetSaveMode(item: AssetManifestItem, newMode: SaveMode): AssetManifestItem {
  const isArchive = newMode === 'archive';
  const newStored = isArchive
    ? item.originalSizeBytes
    : Math.round(item.originalSizeBytes * 0.35);

  return {
    ...item,
    saveMode: newMode,
    isOriginalPreserved: isArchive,
    storedSizeBytes: newStored,
    qualityState: isArchive ? 'lossless' : 'downsampled',
    updatedAt: new Date().toISOString(),
  };
}

export function performEnhanceOrRevert(item: AssetManifestItem): {
  updatedItem: AssetManifestItem;
  resultType: string;
  message: string;
} {
  const now = new Date().toISOString();
  if (item.saveMode === 'space_saver') {
    if (item.qualityState === 'downsampled') {
      const updatedItem: AssetManifestItem = {
        ...item,
        qualityState: 'enhanced_approximation',
        updatedAt: now,
      };
      return {
        updatedItem,
        resultType: 'enhanced',
        message: `Applied synthetic enhancement filter to "${item.name}" (Approximation)`,
      };
    } else {
      const updatedItem: AssetManifestItem = {
        ...item,
        qualityState: 'downsampled',
        updatedAt: now,
      };
      return {
        updatedItem,
        resultType: 'reverted',
        message: `Reverted "${item.name}" to downsampled standard representation`,
      };
    }
  } else {
    // In archive mode, original is preserved
    const updatedItem: AssetManifestItem = {
      ...item,
      qualityState: 'original',
      storedSizeBytes: item.originalSizeBytes,
      updatedAt: now,
    };
    return {
      updatedItem,
      resultType: 'lossless_restored',
      message: `Restored pristine bit-exact original copy of "${item.name}" from archive`,
    };
  }
}

export interface TrimPlanCandidate {
  item: AssetManifestItem;
  savingsBytes: number;
  reason: string;
}

export function simulateTrimPlan(
  items: AssetManifestItem[],
  targetBytesToFree: number,
  priority: TrimCategoryPriority[]
): {
  itemsToPrune: TrimPlanCandidate[];
  totalSimulatedSavingsBytes: number;
} {
  const candidates: TrimPlanCandidate[] = [];
  let accumulatedSavings = 0;

  for (const prio of priority) {
    if (accumulatedSavings >= targetBytesToFree) break;

    const matched = items.filter((item) => {
      if (item.isCore) return false;
      if (prio === 'cache') return item.category === 'cache';
      if (prio === 'stale_knowledge') return item.knowledgeStatus === 'stale';
      if (prio === 'downsampled_user_files')
        return item.category === 'user_file' && item.saveMode === 'space_saver';
      if (prio === 'chat_history') return item.category === 'chat_history';
      if (prio === 'knowledge_packs') return item.category === 'knowledge_pack';
      if (prio === 'models') return item.category === 'model' && !item.isCore;
      return false;
    });

    for (const item of matched) {
      if (accumulatedSavings >= targetBytesToFree) break;
      const savings = item.storedSizeBytes;
      candidates.push({
        item,
        savingsBytes: savings,
        reason: `Trimmed under policy: ${prio.replace(/_/g, ' ')}`,
      });
      accumulatedSavings += savings;
    }
  }

  return {
    itemsToPrune: candidates,
    totalSimulatedSavingsBytes: accumulatedSavings,
  };
}
