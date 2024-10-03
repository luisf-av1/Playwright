const {test, spect, expect } = require('@playwright/test');

test("First PW Test", async({page})=>{
    await page.goto("https://playwright.dev");

    //asertion
    const title = page.locator('.navbar__inner .navbar__title');
    await expect(title).toHaveText('Playwright');

    // await page.pause();
});

test("Simple click test", async ({page})=>{
    await page.goto("https://the-internet.herokuapp.com/"); //Go to page

    const locatot = page.locator('text=Add Element') //select element by text
    await locatot.click(); //click element

    await page.click('text=Add/Remove Elements'); //click element alternative option
});