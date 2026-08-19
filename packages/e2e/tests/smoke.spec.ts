import { test, expect } from '@playwright/test';

test.describe('CEWERS Smoke Tests', () => {
  
  test('API Health Check', async ({ request }) => {
    // Test the API directly
    const response = await request.get('http://localhost:4000/api/health');
    expect(response.ok()).toBeTruthy();
    
    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.info.database.status).toBe('up');
  });

  test('Console App Loads and Prompts Login', async ({ page }) => {
    // Go to the Console URL
    await page.goto('/');
    
    // Check if the title is correct
    await expect(page).toHaveTitle(/CEWERS/i);
    
    // We expect the login screen to be visible for an unauthenticated user
    // The exact text might differ, but 'Login' or similar should exist
    await expect(page.locator('text=/login|sign in/i').first()).toBeVisible();
  });

});
