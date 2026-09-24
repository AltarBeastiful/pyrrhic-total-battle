// Mirror of `src/kernel/layout.ts` — the layout is documented there, and only there. Change both together;
// `tests/kernel/parity.test.ts` reads the exported copies below and fails when they drift.

// Header
export const H_TYPES: i32 = 0;
export const H_ENEMY_SQUADS: i32 = 1;
export const H_MODE: i32 = 2;
export const H_HOUSING_LEADERSHIP: i32 = 3;
export const H_HOUSING_AUTHORITY: i32 = 4;
export const H_HOUSING_DOMINANCE: i32 = 5;
export const H_TEMPLE_DIVISOR: i32 = 6;
export const H_RATE_SILVER: i32 = 7;
export const H_RATE_GOLD: i32 = 8;
export const H_RATE_HIRED: i32 = 9;
export const H_RATE_DRAGON_COINS: i32 = 10;
export const H_RATE_SECONDS: i32 = 11;
export const HEADER_SIZE: i32 = 16;

// Per type
export const T_HP: i32 = 0;
export const T_STR: i32 = 1;
export const T_BASE_STRENGTH: i32 = 2;
export const T_BRACKET: i32 = 3;
export const T_COST: i32 = 4;
export const T_POOL: i32 = 5;
export const T_RANK: i32 = 6;
export const T_HAS_TRAINING: i32 = 7;
export const T_TRAINING_SILVER: i32 = 8;
export const T_TRAINING_SECONDS: i32 = 9;
export const T_TRAINING_DRAGON_COINS: i32 = 10;
export const T_REDUCTION: i32 = 11;
export const T_SPEED: i32 = 12;
export const T_REVIVAL_GOLD: i32 = 13;
export const T_FAMILY: i32 = 14;
export const T_TIER: i32 = 15;
export const T_FAMILY_REVIVED: i32 = 16;
export const TYPE_STRIDE: i32 = 20;

// Record
export const R_MIN_DAMAGE: i32 = 0;
export const R_SILVER: i32 = 1;
export const R_GOLD: i32 = 2;
export const R_HIRED: i32 = 3;
export const R_DRAGON_COINS: i32 = 4;
export const R_SECONDS: i32 = 5;
export const R_MAX_DAMAGE: i32 = 6;
export const R_AVG_DAMAGE: i32 = 7;
export const R_LEADERSHIP_USED: i32 = 8;
export const R_AUTHORITY_USED: i32 = 9;
export const R_DOMINANCE_USED: i32 = 10;
export const R_DAMAGE_PER_SILVER: i32 = 11;
export const R_DAMAGE_PER_GOLD: i32 = 12;
export const R_DAMAGE_PER_DRAGON_COIN: i32 = 13;
export const R_STACK_COUNT: i32 = 14;
export const RECORD_SIZE: i32 = 16;

export const FAMILIES: i32 = 5;
