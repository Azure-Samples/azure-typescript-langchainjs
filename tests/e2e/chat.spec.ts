import { test, expect } from '@playwright/test';

test.describe('Chat interface', () => {
  test('should load the chat interface', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loaded correctly
    await expect(page.locator('h1')).toHaveText('Azure OpenAI Chatbot');
    
    // Check that the Azure logo is visible
    await expect(page.locator('img[alt="Microsoft Azure Logo"]')).toBeVisible();
    
    // Check that the chat interface is visible
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('textarea')).toBeVisible();
    await expect(page.locator('button')).toBeVisible();
  });

  test('should send a message and receive a response', async ({ page }) => {
    // Mock the API response
    await page.route('/api/chat', async route => {
      const postData = JSON.parse(route.request().postData() || '{}');
      
      // Validate that the request contains expected data
      expect(postData).toHaveProperty('messages');
      expect(Array.isArray(postData.messages)).toBe(true);
      
      // Return a mock response
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'This is a test response from the mocked API.' }),
      });
    });
    
    await page.goto('/');
    
    // Get the initial message count
    const initialMessageCount = await page.locator('.space-y-4 > div').count();
    
    // Type and send a message
    await page.locator('textarea').fill('Hello, how are you?');
    await page.locator('button').click();
    
    // Check that the user message appears
    await expect(page.locator('.space-y-4 > div').nth(initialMessageCount)).toContainText('Hello, how are you?');
    
    // Check that the assistant response appears
    await expect(page.locator('.space-y-4 > div').nth(initialMessageCount + 1)).toContainText('This is a test response from the mocked API.');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock a failed API response
    await page.route('/api/chat', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'An error occurred while processing your request' }),
      });
    });
    
    await page.goto('/');
    
    // Type and send a message
    await page.locator('textarea').fill('This will trigger an error');
    await page.locator('button').click();
    
    // Check that an error message appears
    await expect(page.locator('.bg-red-100')).toBeVisible();
    await expect(page.locator('.bg-red-100')).toContainText('Failed to send message');
  });
});
