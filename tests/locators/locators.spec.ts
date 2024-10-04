const {test, expect } = require('@playwright/test');

const baseUrl = " https://demoqa.com/text-box";

test.beforeEach(async({page})=>{
    await page.goto(baseUrl);
})

test.only("TC | Validate page to test", async({page})=>{
    expect(page).toHaveTitle("DEMOQA");
    expect(page).toHaveURL(baseUrl);
});

test("TC | Validate submit information", async({page})=>{
    //xpath selector
    const title = page.locator("xpath=//h1[contain(text(),'Check B')]")
    await page.locator("//input[@id='userName']").type("Mr. Lubot"); 

    //css selector
    await page.locator("[placeholder='name@example.com']").type("test@test.com"); 
    await page.locator("#currentAddress").type("This is the current address");
    await page.locator("#permanentAddress").type("This is a permanent address");
    await page.locator("button:has-text('Submit')").click();

    const name = page.locator("p#name");
    const email = page.locator("p#email");
    const currentAddress = page.locator("p#currentAddress");
    const permanentAddress = page.locator("p#permanentAddress");

    //Assertions:
    await expect(name).toBeVisible();
    await expect(name).toHaveText('Name:Mr. Lubot');
    await expect(email).toBeVisible();
    await expect(email).toHaveText('Email:test@test.com');
    await expect(currentAddress).toBeVisible();
    await expect(currentAddress).toHaveText('Current Address :This is the current address');
    await expect(permanentAddress).toHaveText('Permananet Address :This is a permanent address');
})
