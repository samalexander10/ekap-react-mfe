import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd();

Given('I am on the chat page', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByPlaceholder('Ask about policies, benefits, name changes…')).toBeVisible();
});

Then('the chat input field is visible', async ({ page }) => {
  await expect(page.getByPlaceholder('Ask about policies, benefits, name changes…')).toBeVisible();
});

Then('the send button is visible', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Send message' })).toBeVisible();
});

When('I type {string} in the chat', async ({ page }, message: string) => {
  await page.getByPlaceholder('Ask about policies, benefits, name changes…').fill(message);
});

When('I send the message', async ({ page }) => {
  await page.getByRole('button', { name: 'Send message' }).click();
});

Then('my message appears in the chat', async ({ page }) => {
  // User messages appear immediately in the chat
  await expect(page.getByText('What is the vacation policy?')).toBeVisible({ timeout: 10_000 });
});

Then('I receive a response from the assistant', async ({ page }) => {
  // Send button is re-enabled when streaming is complete
  await expect(page.getByRole('button', { name: 'Send message' })).toBeEnabled({ timeout: 60_000 });
  // The assistant avatar label "AI" appears in the chat
  await expect(page.getByText('AI').first()).toBeVisible();
});

Then('a {string} action chip appears', async ({ page }, chipLabel: string) => {
  await expect(
    page.locator('button').filter({ hasText: chipLabel })
  ).toBeVisible({ timeout: 60_000 });
});
