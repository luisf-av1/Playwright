import { test, expect } from '@playwright/test';
const path = require('path');


test.describe('TS | Web Elements', async () => {
    test("TC | Checkbox", async ({page})=>{
        await page.goto("https://the-internet.herokuapp.com/checkboxes");

        await page.locator('input[type="checkbox"]').first().check();
        await page.locator('input[type="checkbox"]').last().check();
        
        await page.locator('input[type="checkbox"]').first().uncheck();
        
    })

    test("TC | Drag & Drop", async ({page})=>{
        await page.goto("https://the-internet.herokuapp.com/drag_and_drop");

        await page.dragAndDrop('#column-a','#column-b');
    })

    test("TC | Dropdown lists", async ({page})=>{
        await page.goto("https://the-internet.herokuapp.com/dropdown");

        await page.locator("[id='dropdown']").selectOption('1'); //Select option by value attribute
        await expect(page.locator("[id='dropdown']")).toHaveValue('1');

        await page.locator("[id='dropdown']").selectOption({label: 'Option 2'}); //Select option by text
        await expect(page.locator("[id='dropdown']")).toHaveValue('2');
    })

    test("TC | File download", async ({page})=>{
        await page.goto("https://the-internet.herokuapp.com/download");

        // Start waiting for download before clicking. Note no await.
        const downloadPromise = page.waitForEvent('download');
        await page.getByText('random_data.txt').click();
        const download = await downloadPromise;

        // Wait for the download process to complete and save the downloaded file somewhere.
        await download.saveAs('resource/downloads/' + download.suggestedFilename());
    })

    test.only("TC | File upload", async ({page})=>{
        await page.goto("https://the-internet.herokuapp.com/upload");

        // Start waiting for file chooser before clicking. Note no await.
        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.locator('#file-upload').click();
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles('resource/downloads/random_data.txt');

        await page.locator('#file-submit').click();

        await expect(page.locator("h3")).toHaveText("File Uploaded!");

        await page.pause();
    })
});