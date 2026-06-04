/**
 * Assessment parser: calculates grade based on skill coefficients.
 * Run in browser console on assessment page.
 */

const GRADES = [
    { min: 0.0,  max: 0.9,  g: 'Не определен' },
    { min: 0.9,  max: 1.8,  g: 'Intern' },
    { min: 1.8,  max: 2.25, g: 'Junior' },
    { min: 2.25, max: 2.7,  g: 'Junior+' },
    { min: 2.7,  max: 3.15, g: 'Middle' },
    { min: 3.15, max: 3.6,  g: 'Middle+' },
    { min: 3.6,  max: 3.8,  g: 'Senior' },
    { min: 3.8,  max: 4.0,  g: 'Senior+' }
];

const LEVELS = [1, 2, 3, 4];

function getGrade(coef) {
    const match = GRADES.find(r => coef >= r.min && coef < r.max);
    return match ? match.g : coef >= 4.0 ? 'Senior+' : 'Не определен';
}

async function expandAll() {
    let total = 0, clicked;
    do {
        clicked = 0;
        document.querySelectorAll('[data-test-id="collapsible-wrapper"]').forEach(w => {
            const content = w.querySelector('[class*="collapse__content"]');
            if (content?.style.height === '0px') { w.click(); clicked++; }
        });
        
        document.querySelectorAll('[class*="optionsListCollapsed"]').forEach(list => {
            list.querySelector('[data-test-id="knowledge-card-select"]')?.click();
            clicked++;
        });
        
        total += clicked;
        if (clicked) await new Promise(r => setTimeout(r, 200));
    } while (clicked);
    return total;
}

function parseTab(name) {
    const cards = document.querySelectorAll('[data-test-id="independent-card"]');
    const byLevel = Object.fromEntries(LEVELS.map(l => [l, { total: 0, checked: 0 }]));
    
    cards.forEach(card => {
        if (!isVisible(card)) return;
        if (isCollapsed(card)) return;
        
        const checkbox = card.querySelector('input[data-test-id="card-checkbox"]');
        const levelEl = card.querySelector('.status__ellipsis_KzWbe');
        if (!checkbox || !levelEl) return;
        
        const match = levelEl.textContent.trim().match(/^(\d)\s*—/);
        if (!match) return;
        
        const level = parseInt(match[1]);
        if (!LEVELS.includes(level)) return;
        
        byLevel[level].total++;
        if (checkbox.checked) byLevel[level].checked++;
    });
    
    document.querySelectorAll('[data-test-id="cumulative-card"]').forEach(card => {
        const optionsList = card.nextElementSibling?.querySelector('[class*="optionsList"]');
        if (!optionsList) return;
        if (!isVisible(optionsList)) return;
        
        const selected = optionsList.querySelector('input[type="radio"]:checked');
        if (!selected) return;
        
        const levelEl = selected.closest('[class*="level-select-options"]')?.querySelector('.status__ellipsis_KzWbe');
        if (!levelEl) return;
        
        const match = levelEl.textContent.trim().match(/^(\d)\s*—/);
        if (!match) return;
        
        const level = parseInt(match[1]);
        if (!LEVELS.includes(level)) return;
        
        byLevel[level].total++;
        byLevel[level].checked++;
    });
    
    return { name, byLevel };
}

function isVisible(el) {
    const s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && el.offsetParent;
}

function isCollapsed(card) {
    const content = card.closest('[class*="collapse__content"]');
    return content && (content.style.height === '0px' || content.style.height === '0');
}

function calcCoefs(tab) {
    let totalCoef = 0;
    const result = { name: tab.name, byLevel: {}, totalCoef: 0, grade: '' };
    
    LEVELS.forEach(l => {
        const { total, checked } = tab.byLevel[l];
        const coef = total ? Math.round(checked / total * 1000) / 1000 : 0;
        result.byLevel[l] = { total, checked, coef };
        totalCoef += coef;
    });
    
    result.totalCoef = Math.round(totalCoef * 1000) / 1000;
    result.grade = getGrade(result.totalCoef);
    return result;
}

function printResults(tab) {
    console.log(`\n${tab.name}`);
    console.log(`Grade: ${tab.grade}`);
    
    const parts = [];
    LEVELS.forEach(l => {
        const { total, checked, coef } = tab.byLevel[l];
        if (total) {
            console.log(`  L${l}: ${checked}/${total} = ${coef}`);
            parts.push(coef);
        }
    });
    
    console.log(`  Sum: ${parts.join(' + ')} = ${tab.totalCoef}`);
}

async function run() {
    console.log('='.repeat(50));
    console.log('ASSESSMENT');
    console.log('='.repeat(50));
    
    const EXCLUDED_TABS = ['Дополнительная активность'];
    const tabs = document.querySelectorAll('[data-test-id="assessment-stepper-step"]');
    const tabList = Array.from(tabs).map(tab => {
        let name = tab.textContent.replace(/\s+/g, ' ').trim();
        return { el: tab, name };
    }).filter(t => !EXCLUDED_TABS.some(e => t.name.includes(e)));
    
    const results = [];
    
    for (const tab of tabList) {
        tab.el.click();
        await new Promise(r => setTimeout(r, 500));
        
        for (let i = 0; i < 3; i++) {
            await expandAll();
            await new Promise(r => setTimeout(r, 200));
        }
        
        const parsed = parseTab(tab.name);
        const calc = calcCoefs(parsed);
        results.push(calc);
        printResults(calc);
    }
    
    const totals = { byLevel: {} };
    LEVELS.forEach(l => totals.byLevel[l] = { total: 0, checked: 0, coef: 0 });
    
    results.forEach(r => LEVELS.forEach(l => {
        totals.byLevel[l].total += r.byLevel[l].total;
        totals.byLevel[l].checked += r.byLevel[l].checked;
    }));
    
    let totalCoef = 0;
    LEVELS.forEach(l => {
        const { total, checked } = totals.byLevel[l];
        totals.byLevel[l].coef = total ? Math.round(checked / total * 1000) / 1000 : 0;
        totalCoef += totals.byLevel[l].coef;
    });
    totalCoef = Math.round(totalCoef * 1000) / 1000;
    
    console.log('\n' + '='.repeat(50));
    console.log('TOTAL');
    console.log('='.repeat(50));
    LEVELS.forEach(l => {
        const { total, checked, coef } = totals.byLevel[l];
        if (total) console.log(`L${l}: ${checked}/${total} = ${coef}`);
    });
    console.log(`\nTOTAL COEF: ${totalCoef}`);
    console.log(`GRADE: ${getGrade(totalCoef)}`);
}

run();
