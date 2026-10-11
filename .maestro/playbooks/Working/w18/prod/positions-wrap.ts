import { positionTrades as real } from '@/ui/sections/march/positions';
import { time } from './split';
export * from '@/ui/sections/march/positions';
export const positionTrades = time(real, 'tight');
