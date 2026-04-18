import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import path from 'path';

const { Given, When, Then } = createBdd();

async function triggerNameChangeFlow(page: import('@playwright/test').Page) {
  await page.getByPlaceholder('Ask about policies, benefits, name changes…')
    .fill('I would like to change my last name');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(
    page.locator('button').filter({ hasText: 'Start Name Change Request' })
  ).toBeVisible({ timeout: 60_000 });
}

Given('I have triggered the name change flow', async ({ page }) => {
  await triggerNameChangeFlow(page);
});

When('I click the {string} action chip', async ({ page }, chipLabel: string) => {
  await page.locator('button').filter({ hasText: chipLabel }).click();
});

Then('the name change form is visible', async ({ page }) => {
  // The form is rendered directly in a side panel (not an iframe)
  // Wait for the new last name field to be visible in the panel
  await expect(page.locator('#newLastName')).toBeVisible({ timeout: 15_000 });
});

Then('I see a field for the new last name', async ({ page }) => {
  await expect(page.locator('#newLastName')).toBeVisible();
});

Then('I see a submit button', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Submit Name Change Request' })).toBeVisible();
});

Given('I have opened the name change form', async ({ page }) => {
  await page.locator('button').filter({ hasText: 'Start Name Change Request' }).click();
  await expect(page.locator('#newLastName')).toBeVisible({ timeout: 15_000 });
});

When('I enter {string} as the new last name', async ({ page }, lastName: string) => {
  await page.locator('#newLastName').fill(lastName);
});

When('I select {string} as the document type', async ({ page }, docType: string) => {
  await page.locator('#documentType').selectOption({ label: docType });
});

When('I upload a supporting document', async ({ page }) => {
  const stubFile = path.join(__dirname, '../fixtures/stub.pdf');
  await page.locator('input[type="file"]').setInputFiles(stubFile);
});

When('I submit the name change form', async ({ page }) => {
  // Intercept the HR API call and return a mock success
  await page.route('**/name-change**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        request_id: 'TEST-2024-001',
        status: 'pending',
        message: 'Name change request submitted successfully',
      }),
    });
  });
  await page.getByRole('button', { name: 'Submit Name Change Request' }).click();
});

Then('I see a submission confirmation', async ({ page }) => {
  // The panel transitions to a success/confirmation state
  await expect(
    page.getByText('submitted').or(
      page.getByText('Request ID').or(
        page.getByText('success', { exact: false }).or(
          page.locator('[class*="success"]')
        )
      )
    )
  ).toBeVisible({ timeout: 30_000 });
});
