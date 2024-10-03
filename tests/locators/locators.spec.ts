const {test, expect } = require('@playwright/test');

test("Testign selectors", async({page})=>{
    await page.goto("https://demoqa.com/text-box");
    await page.locator("#userName").type("Test username");
    await page.locator("[placeholder='name@example.com']").type("test@test.com");
    await page.locator("#currentAddress").type("This is the current address");
    await page.locator("#permanentAddress").type("This is a permanent address");
    await page.locator("button:has-text('Submit')").click();
});
