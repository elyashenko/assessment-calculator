/**
 * Script to parse assessment page and calculate metrics:
 * - Coefficient breakdown by level (1-intern, 2-junior, 3-middle, 4-senior) across ALL tabs
 * - Total coefficient (sum of per-level coefficients)
 * - Grade determination based on total coefficient
 * - INTERMEDIATE results for each category (tab)
 * 
 * Run this in the browser console on the assessment page.
 * Script will automatically navigate through all tabs and collect metrics.
 */

/**
 * Grade table based on total coefficient range
 */
const GRADE_TABLE = [
    { min: 0.0,  max: 0.9,  grade: 'Не определен' },
    { min: 0.9,  max: 1.8,  grade: 'Intern' },
    { min: 1.8,  max: 2.25, grade: 'Junior' },
    { min: 2.25, max: 2.7,  grade: 'Junior+' },
    { min: 2.7,  max: 3.15, grade: 'Middle' },
    { min: 3.15, max: 3.6,  grade: 'Middle+' },
    { min: 3.6,  max: 3.8,  grade: 'Senior' },
    { min: 3.8,  max: 4.0,  grade: 'Senior+' }
];

/**
 * Level names mapping
 */
const LEVEL_NAMES = {
    1: { short: 'Intern', full: 'Intern', level: 'Уровень 1 (Intern)' },
    2: { short: 'Junior', full: 'Junior', level: 'Уровень 2 (Junior)' },
    3: { short: 'Middle', full: 'Middle', level: 'Уровень 3 (Middle)' },
    4: { short: 'Senior', full: 'Senior', level: 'Уровень 4 (Senior)' }
};

/**
 * Determine grade based on total coefficient
 */
function getGrade(totalCoefficient) {
    for (const entry of GRADE_TABLE) {
        if (totalCoefficient >= entry.min && totalCoefficient < entry.max) {
            return entry.grade;
        }
    }
    if (totalCoefficient >= 4.0) {
        return 'Senior+';
    }
    return 'Не определен';
}

/**
 * Expand all collapsed sections on the page.
 */
function expandAllSections() {
    const hiddenSections = document.querySelectorAll('.hidable__hidden_ytUuw');
    
    if (hiddenSections.length === 0) {
        return 0;
    }
    
    let expandedCount = 0;
    
    hiddenSections.forEach((section) => {
        const parent = section.closest('[class*="hidable"]') || section.parentElement;
        
        if (parent) {
            const toggle = parent.querySelector('button, [role="button"], [class*="toggle"], [class*="header"], [class*="chevron"]');
            
            if (toggle) {
                toggle.click();
                expandedCount++;
            } else {
                const parentClickable = parent.closest('button, [role="button"], [class*="toggle"], [class*="header"]');
                if (parentClickable) {
                    parentClickable.click();
                    expandedCount++;
                }
            }
        }
    });
    
    return expandedCount;
}

/**
 * Parse cards in the current tab
 */
function parseCurrentTab(tabName) {
    const checkboxes = document.querySelectorAll('input[data-test-id="card-checkbox"]');
    
    const metrics = {
        tabName: tabName,
        totalChecked: 0,
        totalUnchecked: 0,
        byLevel: {
            1: { name: 'intern', total: 0, checked: 0 },
            2: { name: 'junior', total: 0, checked: 0 },
            3: { name: 'middle', total: 0, checked: 0 },
            4: { name: 'senior', total: 0, checked: 0 }
        }
    };
    
    checkboxes.forEach((checkbox) => {
        const isChecked = checkbox.checked;
        const card = checkbox.closest('[data-test-id="independent-card"]');
        
        if (!card) return;
        
        const levelSpan = card.querySelector('.status__ellipsis_KzWbe');
        if (!levelSpan) return;
        
        const levelText = levelSpan.textContent.trim();
        const levelMatch = levelText.match(/^(\d)\s*—\s*(\w+)/);
        
        if (!levelMatch) return;
        
        const level = parseInt(levelMatch[1]);
        if (![1, 2, 3, 4].includes(level)) return;
        
        metrics.byLevel[level].total++;
        if (isChecked) {
            metrics.totalChecked++;
            metrics.byLevel[level].checked++;
        } else {
            metrics.totalUnchecked++;
        }
    });
    
    return metrics;
}

/**
 * Calculate coefficients for a tab's metrics
 */
function calculateTabCoefficients(metrics) {
    const result = {
        tabName: metrics.tabName,
        totalChecked: metrics.totalChecked,
        totalUnchecked: metrics.totalUnchecked,
        byLevel: {},
        totalCoefficient: 0
    };
    
    for (const level of [1, 2, 3, 4]) {
        const data = metrics.byLevel[level];
        const coefficient = data.total > 0 ? Math.round((data.checked / data.total) * 1000) / 1000 : 0;
        result.byLevel[level] = {
            ...data,
            coefficient: coefficient
        };
        result.totalCoefficient += coefficient;
    }
    
    result.totalCoefficient = Math.round(result.totalCoefficient * 1000) / 1000;
    result.grade = getGrade(result.totalCoefficient);
    
    return result;
}

/**
 * Print intermediate results for a single category (tab)
 */
function printIntermediateResults(metrics) {
    const calculated = calculateTabCoefficients(metrics);
    
    console.log();
    console.log(`📋 ${calculated.tabName}`);
    console.log(`   ${calculated.grade}`);
    
    for (const level of [1, 2, 3, 4]) {
        const data = calculated.byLevel[level];
        if (data.total > 0) {
            console.log(`   ${LEVEL_NAMES[level].level}`);
            console.log(`   Вы набрали ${data.checked} из ${data.total} баллов и это ${data.coefficient}`);
        }
    }
    
    // Build coefficient sum string
    const coefStrings = [];
    for (const level of [1, 2, 3, 4]) {
        const data = calculated.byLevel[level];
        if (data.total > 0) {
            coefStrings.push(data.coefficient.toFixed(3));
        }
    }
    
    console.log(`   Общая сумма коэффициентов`);
    console.log(`   ${coefStrings.join(' + ')} = ${calculated.totalCoefficient.toFixed(3)}`);
    console.log(`   Эта сумма соответствует грейду ${calculated.grade}`);
    
    return calculated;
}

/**
 * Tabs to exclude from calculation
 */
const EXCLUDED_TABS = ['Дополнительная активность'];

/**
 * Get all tabs (excluding specified ones)
 */
function getAllTabs() {
    const tabs = document.querySelectorAll('[data-test-id="assessment-stepper-step"]');
    return Array.from(tabs)
        .map(tab => {
            const textElement = tab.querySelector('.stepscomponents-step-__text_FswXy');
            return {
                element: tab,
                name: textElement ? textElement.textContent.trim() : 'Unknown'
            };
        })
        .filter(tab => !EXCLUDED_TABS.includes(tab.name));
}

/**
 * Click a tab to make it active
 */
function clickTab(tab) {
    tab.element.click();
}

/**
 * Main function to parse all tabs and calculate totals across all tabs
 */
async function parseAllTabs() {
    console.log('='.repeat(60));
    console.log('ASSESSMENT METRICS REPORT');
    console.log('='.repeat(60));
    
    // Expand all sections first
    expandAllSections();
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Get all tabs
    const tabs = getAllTabs();
    console.log();
    console.log(`Found ${tabs.length} tab(s): ${tabs.map(t => t.name).join(', ')}`);
    
    // Collect metrics from each tab
    const tabResults = [];
    const calculatedTabs = [];
    
    for (const tab of tabs) {
        console.log();
        console.log(`Processing tab: ${tab.name}...`);
        clickTab(tab);
        await new Promise(resolve => setTimeout(resolve, 500));
        expandAllSections();
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const metrics = parseCurrentTab(tab.name);
        tabResults.push(metrics);
        
        // Print intermediate results for this category
        const calculated = printIntermediateResults(metrics);
        calculatedTabs.push(calculated);
        
        console.log(`  Found ${metrics.totalChecked + metrics.totalUnchecked} cards`);
    }
    
    // Calculate TOTALS across all tabs
    const totals = {
        totalChecked: 0,
        totalUnchecked: 0,
        byLevel: {
            1: { name: 'intern', total: 0, checked: 0, coefficient: 0 },
            2: { name: 'junior', total: 0, checked: 0, coefficient: 0 },
            3: { name: 'middle', total: 0, checked: 0, coefficient: 0 },
            4: { name: 'senior', total: 0, checked: 0, coefficient: 0 }
        }
    };
    
    // Sum up all tabs
    for (const tab of tabResults) {
        totals.totalChecked += tab.totalChecked;
        totals.totalUnchecked += tab.totalUnchecked;
        for (const level of [1, 2, 3, 4]) {
            totals.byLevel[level].total += tab.byLevel[level].total;
            totals.byLevel[level].checked += tab.byLevel[level].checked;
        }
    }
    
    // Calculate coefficients per level (rounded to 3 decimal places)
    for (const level of [1, 2, 3, 4]) {
        const data = totals.byLevel[level];
        data.coefficient = data.total > 0 ? Math.round((data.checked / data.total) * 1000) / 1000 : 0;
    }
    
    // Calculate total coefficient
    let totalCoefficient = 0;
    for (const level of [1, 2, 3, 4]) {
        totalCoefficient += totals.byLevel[level].coefficient;
    }
    totalCoefficient = Math.round(totalCoefficient * 1000) / 1000;
    const grade = getGrade(totalCoefficient);
    
    // Print TOTAL summary
    console.log();
    console.log('='.repeat(60));
    console.log('TOTAL (ALL TABS)');
    console.log('='.repeat(60));
    console.log();
    console.log(`Total cards: ${totals.totalChecked + totals.totalUnchecked}`);
    console.log(`Checked: ${totals.totalChecked}, Unchecked: ${totals.totalUnchecked}`);
    console.log();
    
    console.log('Coefficients by level:');
    for (const level of [1, 2, 3, 4]) {
        const data = totals.byLevel[level];
        console.log(`  ${LEVEL_NAMES[level].short}: ${data.checked}/${data.total} = ${data.coefficient.toFixed(3)}`);
    }
    
    console.log();
    console.log(`TOTAL COEFFICIENT: ${totalCoefficient.toFixed(3)}`);
    console.log(`GRADE:             ${grade}`);
    
    // Print grade table reference
    console.log();
    console.log('-'.repeat(60));
    console.log('GRADE TABLE');
    console.log('-'.repeat(60));
    console.log('| Coefficient Range | Grade       |');
    console.log('|-------------------|-------------|');
    console.log('| 0.0 – 0.9         | Не определен|');
    console.log('| 0.9 – 1.8         | Intern      |');
    console.log('| 1.8 – 2.25        | Junior      |');
    console.log('| 2.25 – 2.7        | Junior+     |');
    console.log('| 2.7 – 3.15        | Middle      |');
    console.log('| 3.15 – 3.6        | Middle+     |');
    console.log('| 3.6 – 3.8         | Senior      |');
    console.log('| 3.8 – 4.0         | Senior+     |');
    
    console.log();
    console.log('='.repeat(60));
    
    // Store results globally for programmatic access
    window.assessmentResults = {
        categories: calculatedTabs,
        total: {
            checked: totals.totalChecked,
            total: totals.totalChecked + totals.totalUnchecked,
            byLevel: {
                intern: totals.byLevel[1].coefficient,
                junior: totals.byLevel[2].coefficient,
                middle: totals.byLevel[3].coefficient,
                senior: totals.byLevel[4].coefficient
            },
            totalCoefficient: totalCoefficient,
            grade: grade
        }
    };
}

// Run the analysis
parseAllTabs();
