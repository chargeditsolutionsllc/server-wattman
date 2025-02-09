'use server';

import { PowerData } from '../types/server';
import { fetchAllServersPower } from '../utils/serverUtils';

export async function getPowerData(): Promise<PowerData[]> {
  try {
    return await fetchAllServersPower();
  } catch (error) {
    console.error('Failed to fetch power data:', error);
    return [];
  }
}
