import { test, expect } from '@playwright/test';

test.describe("TS | Example", async () => {

    test("PW Test 1", async ({ page }) => {
        await page.goto("");
    });

    test("PW Test 2", async ({ page }) => {
        await page.goto("");
    });

    test("PW Test 3", async ({ page }) => {
        await page.goto("/");
    });

    test("PW Test 4", async ({ page }) => {
        await page.goto("https://the-internet.herokuapp.com");
    });
})