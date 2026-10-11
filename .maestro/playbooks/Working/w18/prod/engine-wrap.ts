import { planCampaign as real } from '@/engine';
import { time } from './split';
export * from '@/engine';
export const planCampaign = time(real, 'plan');
