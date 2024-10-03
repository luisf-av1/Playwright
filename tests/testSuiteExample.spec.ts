import { test, expect } from '@playwright/test';

test.describe("TS | Example", async () => {

    test("PW Test 1", async ({ page }) => {
        await page.goto("https://playwright.dev");
    });

    test("PW Test 2", async ({ page }) => {
        await page.goto("https://playwright.dev");
    });

    test("PW Test 3", async ({ page }) => {
        await page.goto("https://playwright.dev");
    });

    test("PW Test 4", async ({ page }) => {
        await page.goto("https://playwright.dev");
    });

    test("PW Test 5", async ({ page }) => {
        await page.goto("https://playwright.dev");
    });

})