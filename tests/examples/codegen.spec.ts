import { test, expect } from '@playwright/test';

//npx playwright codegen demoqa.com

test('codegen test', async ({ page }) => {
  await page.goto('https://demoqa.com/');
  await page.locator('div:nth-child(2) > div > .avatar > svg').click();
  await page.getByText('Elements').click();
  await page.locator('li').filter({ hasText: 'Text Box' }).click();
  await page.getByPlaceholder('Full Name').click();
  await page.getByPlaceholder('Full Name').fill('codegen test');
  await page.getByPlaceholder('Full Name').press('Tab');
  await page.getByPlaceholder('name@example.com').fill('test@test.com');
  await page.getByPlaceholder('Current Address').click();
  await page.getByPlaceholder('Current Address').fill('test');
  await page.locator('#permanentAddress').click();
  await page.locator('#permanentAddress').fill('test');
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.locator('li').filter({ hasText: 'Check Box' }).click();
  await page.getByLabel('Toggle').click();
  await page.locator('label').filter({ hasText: 'Desktop' }).getByRole('img').first().click();
  await page.locator('label').filter({ hasText: 'Downloads' }).getByRole('img').first().click();
  await page.locator('li').filter({ hasText: 'Radio Button' }).click();
  await page.locator('div').filter({ hasText: /^No$/ }).click();
  await page.locator('li').filter({ hasText: 'Web Tables' }).click();
  await page.locator('#delete-record-1').getByRole('img').click();
  await page.locator('li').filter({ hasText: 'Buttons' }).click();
  await page.getByRole('button', { name: 'Click Me', exact: true }).click();
  await page.locator('li').filter({ hasText: /^Links$/ }).click();
  await page.getByText('Broken Links - Images').click();
  await page.locator('li').filter({ hasText: 'Upload and Download' }).click();
  await page.getByText('Dynamic Properties').click();
});