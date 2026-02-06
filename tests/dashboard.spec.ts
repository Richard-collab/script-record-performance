import { test, expect } from '@playwright/test';

test('dashboard loads and displays metrics', async ({ page }) => {
  // 1. Go to the dashboard
  await page.goto('http://localhost:5173/');

  // 2. Verify dashboard title
  await expect(page.getByText('话术分析看板')).toBeVisible();

  // 3. Verify Metric Table loads (wait for mock data)
  // Check for a specific metric from the mock data
  await expect(page.getByText('外呼量')).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('900,246')).toBeVisible();

  // 4. Verify Sidebar
  await expect(page.getByText('Analytics Pro')).toBeVisible();

  // 5. Verify Filter Panel
  await expect(page.getByText('分析周期')).toBeVisible();
  await expect(page.getByText('基准组 (CONTROL)')).toBeVisible();

  // 6. Take a screenshot for manual verification
  await page.screenshot({ path: 'dashboard_screenshot.png', fullPage: true });
});
