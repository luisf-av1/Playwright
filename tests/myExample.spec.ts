const {test, expect } = require('@playwright/test');

test("First PW Test", async({page})=>{
    await page.goto("https://playwright.dev");
});

test.fail("Fail PW Test", async({page})=>{
    await page.goto("https://playwright.dev");
});

test.fixme("Fix me PW Test", async({page})=>{
    await page.goto("https://playwright.dev");
});

test.slow("Slow PW Test", async({page})=>{
    await page.goto("https://playwright.dev");
});

test.skip("Skip PW Test", async({page})=>{
    await page.goto("https://playwright.dev");
});

test("Conditional skip PW Test", async({page, browserName})=>{
    test.skip(browserName == "firefox", "working in firefox")
    await page.goto("https://playwright.dev");
});

test("Locator example", async({page})=>{
    await page.goto("https://playwright.dev");

    //asertion
    const title = page.locator('.navbar__inner .navbar__title');
    await expect(title).toHaveText('Playwright');

    // await page.pause();
});

test("Simple click test", async ({page})=>{
    await page.goto("https://the-internet.herokuapp.com/"); //Go to page

    const locator =  page.locator('text=Add/Remove Elements') //select element by text
    await locator.click(); //click element

    await page.click('text=Add Element'); //click element alternative option
});