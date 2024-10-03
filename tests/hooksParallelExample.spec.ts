import { test, expect } from '@playwright/test';

test.describe.parallel("TS | Example", async () => {

    test.beforeEach(async ({page}, testInfo)=>{
        console.log(`\n${testInfo.title} starting...`)
        await page.goto("");
    });

    test("TC1", async ({page}, testInfo)=>{
        const locator =  page.locator('text=A/B Testing') //select element by text
        await locator.click(); //click element
    });
    
    test("TC2", async ({page}, testInfo)=>{
        const locator =  page.locator('text=Add/Remove Elements') //select element by text
        await locator.click(); //click element
    });
    
    test("TC3", async ({page}, testInfo)=>{
        const locator =  page.locator('text=Basic Auth') //select element by text
        await locator.click(); //click element
    });
})