const {test, spect, expect } = require('@playwright/test');

test("First PW Test", async({page})=>{
    await page.goto("https://playwright.dev");

    //asertion
    const title = page.locator('.navbar__inner .navbar__title');
    await expect(title).toHaveText('Playwright');

    // await page.pause();
})