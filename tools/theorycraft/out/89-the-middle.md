
## The trade along a sweep of ceilings

Owner's export, scenario C, 4 343 leadership / 2 000 authority, the app's horizon (4). Each row is the
**best plan that fits the ceiling**, as the engine answers it — so the damage column is a floor on what
that much silver buys, and the two ratio columns are what the plan spends to get there. Every figure is
a march's, not the campaign's.

| ceiling, a campaign | silver a march | damage a march | hired burned | damage a silver | damage a hired | marches |
|---|---|---|---|---|---|---|
| 3,000,000 | 737,800 | **4,090,925** | 23 | 5.54 | 177,866.3 | 4 |
| 5,000,000 | 1,094,800 | **4,432,877** | 24 | 4.05 | 184,703.21 | 4 |
| 7,000,000 | 1,709,300 | **5,626,134** | 22 | 3.29 | 255,733.36 | 4 |
| 8,000,000 | 2,324,100 | **6,870,247** | 21 | 2.96 | 327,154.62 | 4 |
| 9,000,000 | 2,354,500 | **6,920,621** | 22 | 2.94 | 314,573.68 | 4 |
| 10,000,000 | 2,354,500 | **6,920,621** | 22 | 2.94 | 314,573.68 | 4 |
| 12,000,000 | 2,354,500 | **6,920,621** | 22 | 2.94 | 314,573.68 | 4 |
| 16,000,000 | 2,354,500 | **6,920,621** | 22 | 2.94 | 314,573.68 | 4 |
| 24,000,000 | 2,354,500 | **6,920,621** | 22 | 2.94 | 314,573.68 | 4 |
A ceiling buys the **best plan inside it**, and the plan that fits it is not the plan that spends it: the
engine answers with the most damage the ceiling allows, so a column that barely moves while the ceiling
doubles is silver the plan declined to spend — and a column that moves while the burn does not is
silver buying damage without touching the stock.

## What the app draws, for comparison

| pick | damage a march | silver a march | hired burned |
|---|---|---|---|
| `spare-the-stock` | **4,262,790** | 2,252,000 | 12 |
| `sweet-spot` | **6,826,445** | 2,256,900 | 21 |
| `most-damage` | **6,920,621** | 2,354,500 | 22 |

`leftOut` = 45 plans on the frontier are not offered by the bar.
The hired soldiers of the account (4 types) are counted inside `mercLost` along with
every monster the account fields, which is why it is larger than the shipped column's own count.
