import AsyncStorage from "@react-native-async-storage/async-storage";

const TTL_MS = 5 * 60 * 1000; // 5 minutes stale-while-revalidate window

interface CacheEntry<T> {
  data: T;
  savedAt: number;
}

export async function readCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    return entry.data;
  } catch {
    return null;
  }
}

export async function writeCache<T>(key: string, data: T): Promise<void> {
  try {
    const entry: CacheEntry<T> = { data, savedAt: Date.now() };
    await AsyncStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Cache write failure is non-critical
  }
}

export async function isCacheStale(key: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return true;
    const entry = JSON.parse(raw) as CacheEntry<unknown>;
    return Date.now() - entry.savedAt > TTL_MS;
  } catch {
    return true;
  }
}

export async function clearCache(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // ignore
  }
}
