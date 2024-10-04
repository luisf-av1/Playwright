import { test, expect } from '@playwright/test';

// npx playwright test tests/tagExample.spec.ts --grep @smoke 
// npx playwright test tests/tagExample.spec.ts --grep @regression  || npx playwright test tests/tagExample.spec.ts --grep-invert @smoke 

test("PW Test 1 @smoke", async({page})=>{
    await page.goto("https://playwright.dev");
});

test("PW Test 2 @regression", async({page})=>{
    await page.goto("https://playwright.dev");
});

test("PW Test 3 @smoke", async({page})=>{
    await page.goto("https://playwright.dev");
});

test("PW Test 4 @regression", async({page})=>{
    await page.goto("https://playwright.dev");
});

test("PW Test 5 @smoke", async({page})=>{
    await page.goto("https://playwright.dev");
});