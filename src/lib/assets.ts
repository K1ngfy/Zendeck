import { get, set } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';

export interface AssetGroup {
  id: string;
  name: string;
  createdAt: number;
}

export interface Asset {
  id: string;
  groupId: string | null;
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string; // Base64 data
  aiPrompt?: string; // AI generated description/prompt
  createdAt: number;
}

const GROUPS_KEY = 'cyberslide_asset_groups';
const ASSETS_KEY = 'cyberslide_assets';

export async function getAssetGroups(): Promise<AssetGroup[]> {
  const groups = await get<AssetGroup[]>(GROUPS_KEY);
  return groups || [{ id: 'default', name: '默认分组', createdAt: Date.now() }];
}

export async function saveAssetGroups(groups: AssetGroup[]): Promise<void> {
  await set(GROUPS_KEY, groups);
}

export async function addAssetGroup(name: string): Promise<AssetGroup> {
  const groups = await getAssetGroups();
  const newGroup: AssetGroup = {
    id: uuidv4(),
    name,
    createdAt: Date.now(),
  };
  groups.push(newGroup);
  await saveAssetGroups(groups);
  return newGroup;
}

export async function getAssets(): Promise<Asset[]> {
  const assets = await get<Asset[]>(ASSETS_KEY);
  return assets || [];
}

export async function saveAssets(assets: Asset[]): Promise<void> {
  await set(ASSETS_KEY, assets);
}

export async function addAsset(
  file: File,
  dataUrl: string,
  groupId: string | null = 'default',
  aiPrompt?: string
): Promise<Asset> {
  const assets = await getAssets();
  const newAsset: Asset = {
    id: uuidv4(),
    groupId,
    name: file.name,
    mimeType: file.type,
    size: file.size,
    dataUrl,
    aiPrompt,
    createdAt: Date.now(),
  };
  assets.unshift(newAsset); // prepended to show newest first
  await saveAssets(assets);
  return newAsset;
}

export async function deleteAsset(id: string): Promise<void> {
  const assets = await getAssets();
  const newAssets = assets.filter(a => a.id !== id);
  await saveAssets(newAssets);
}

export async function updateAsset(id: string, updates: Partial<Asset>): Promise<void> {
  const assets = await getAssets();
  const index = assets.findIndex(a => a.id === id);
  if (index !== -1) {
    assets[index] = { ...assets[index], ...updates };
    await saveAssets(assets);
  }
}
