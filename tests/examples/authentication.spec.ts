import { test, expect } from '@playwright/test';

//credentias: MrLubot, test123*
//npx playwright codegen --save-storage=resource/cookies/auth.json parabank.parasoft.com - save cookies
//npx playwright codegen --load-storage=resource/cookies/auth.json parabank.parasoft.com - use cookies
const baseUrl = "https://parabank.parasoft.com/parabank/index.htm";

test.describe('Authentication', async ()=>{
    test.beforeEach(async({page})=>{
        await page.goto(baseUrl);
    })

    test('Saving authentication', async ({ page }) => {
        await page.locator('input[name="username"]').click();
        await page.locator('input[name="username"]').fill('MrLubot');
        await page.locator('input[name="password"]').click();
        await page.locator('input[name="password"]').fill('test123*');
        await page.getByRole('button', { name: 'Log In' }).click();

        await page.context().storageState({path: "resource/cookies/auth.json"});
    });
})


test.describe('Authentication', async ()=>{
    test.beforeEach(async({page})=>{
        await page.goto(baseUrl);
    })

    //Load authentication
    test.use({
        storageState: 'resource/cookies/auth.json'
    });

    test('LogOut', async ({ page }) => {
        await page.getByRole('link', { name: 'Log Out' }).click();
    });
});