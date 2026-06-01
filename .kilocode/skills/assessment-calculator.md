# Skill: Assessment Calculator

## Overview

| Field | Value |
|-------|-------|
| **Name** | Assessment |
| **Type** | JavaScript Utility Script |
| **Purpose** | Parse assessment and calculate grade based on coefficient sum across all tabs |
| **Target Users** | HR, Team Leads, Assessment Administrators |

## Problem

No built-in way to calculate grade from assessment checkboxes.

## Solution

Browser console script that parses assessment page and outputs metrics with grade calculation.

## Grade Table

| Coefficient Range | Grade |
|-------------------|-------|
| 0.0 – 0.9 | Не определен |
| 0.9 – 1.8 | Intern |
| 1.8 – 2.25 | Junior |
| 2.25 – 2.7 | Junior+ |
| 2.7 – 3.15 | Middle |
| 3.15 – 3.6 | Middle+ |
| 3.6 – 3.8 | Senior |
| 3.8 – 4.0 | Senior+ |

## Algorithm

### Excluded Tabs

The following tabs are excluded from calculation:
- **Дополнительная активность** - not included in grade calculation

### Per-Category Calculation (Промежуточная логика)

For each category (tab), calculate separately:

1. **Sum cards per level** within the category
2. **Calculate coefficient per level**: `checked / total` (rounded to 3 decimal places)
3. **Sum level coefficients** → category total coefficient
4. **Determine category grade** from category total coefficient

### Final Calculation

1. Collect all categories (Общий, Базовые, Технические, Продуктовые, etc.), excluding Дополнительная активность
2. Each category has its own grade breakdown
3. Display intermediate results for each category

## Usage

1. Open assessment page in browser
2. DevTools (F12) → Console
3. Paste `parse_assessment.js`
4. Press Enter

## Output Format

```
============================================================
ASSESSMENT METRICS REPORT
============================================================

📋 Базовые
   Уровень 1 (Intern)
   Вы набрали X из Y баллов и это Z
   Уровень 2 (Junior)
   Вы набрали X из Y баллов и это Z
   Уровень 3 (Middle)
   Вы набрали X из Y баллов и это Z
   Уровень 4 (Senior)
   Вы набрали X из Y баллов и это Z
   Общая сумма коэффициентов
   Z1 + Z2 + Z3 + Z4 = TOTAL
   Эта сумма соответствует грейду GRADE

📋 Технические
   ...

============================================================
TOTAL (ALL TABS)
============================================================

Total cards: 55
Checked: 45, Unchecked: 10

Coefficients by level:
  Intern: 15/20 = 0.750
  Junior: 12/15 = 0.800
  Middle: 10/12 = 0.833
  Senior: 8/8 = 1.000

TOTAL COEFFICIENT: 3.383
GRADE:             Middle+
```

## Files

| File | Description |
|------|-------------|
| `parse_assessment.js` | Main script with per-category breakdown |
| `assessment-calculator.md` | This documentation |

---

*Updated: 2026-06-01*
*Version: v3 (with intermediate category logic)*
