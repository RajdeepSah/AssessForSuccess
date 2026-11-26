import { expect, test } from '@playwright/test';

test.describe('navigation', () => {
  test('skip link moves focus to main content', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
  });

  test('mobile menu opens, closes with Escape and returns focus', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Menu' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#nav-panel').getByRole('link', { name: 'Assessments' })).toBeVisible();
    // The panel must cover the screen below the header (not be clipped to the header bar).
    const box = await page.locator('#nav-panel').boundingBox();
    expect(box?.height ?? 0).toBeGreaterThan(600);
    await expect(page.locator('#nav-panel').getByRole('link', { name: 'Contact' })).toBeInViewport();
    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
  });

  test('desktop submenu opens with the keyboard and closes with Escape', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const subToggle = page.getByRole('button', { name: 'Behavioral Health Care pages' });
    await subToggle.focus();
    await page.keyboard.press('Enter');
    await expect(subToggle).toHaveAttribute('aria-expanded', 'true');
    const link = page.locator('#sub-bhc').getByRole('link', { name: /Treatment/ });
    await expect(link).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(subToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(subToggle).toBeFocused();
  });

  test('homepage tells courts they can refer, above the fold', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');
    const callout = page.getByText('Courts, including juvenile court, can refer young people and adults to us for an assessment.');
    await expect(callout).toBeInViewport();
    await expect(page.getByRole('link', { name: 'Behavioral Health Care', exact: true }).first()).toBeVisible();
  });
});

test.describe('sports registration form', () => {
  test('shows an error summary when submitted empty', async ({ page }) => {
    await page.goto('/sports/register/');
    await page.getByRole('button', { name: 'Send registration' }).click();
    const summary = page.locator('[data-error-summary]');
    await expect(summary).toBeVisible();
    await expect(summary).toBeFocused();
    await expect(summary.getByRole('link')).toHaveCount(7);
    await expect(page).toHaveURL(/\/sports\/register\/$/);
    await expect(page.locator('#f-phone')).toHaveAttribute('aria-invalid', 'true');
  });

  test('reveals sport and skill fields only when relevant', async ({ page }) => {
    await page.goto('/sports/register/');
    const sport = page.getByLabel('Which sport?');
    const skill = page.getByLabel('What skill would your child like to work on?');
    await expect(sport).toBeHidden();
    await expect(skill).toBeHidden();
    await page.getByLabel('A team').check();
    await expect(sport).toBeVisible();
    await expect(skill).toBeHidden();
    await page.getByLabel('One-on-one training').check();
    await expect(skill).toBeVisible();
    await page.getByLabel('Mentoring').check();
    await expect(sport).toBeHidden();
  });

  test('preselects program and sport from the URL', async ({ page }) => {
    await page.goto('/sports/register/?program=training&sport=basketball');
    await expect(page.getByLabel('One-on-one training')).toBeChecked();
    await expect(page.getByLabel('Which sport?')).toHaveValue('basketball');
  });

  test('error clears once the field is fixed', async ({ page }) => {
    await page.goto('/sports/register/');
    await page.getByRole('button', { name: 'Send registration' }).click();
    const phone = page.locator('#f-phone');
    await expect(phone).toHaveAttribute('aria-invalid', 'true');
    await phone.fill('785-555-0100');
    await expect(phone).not.toHaveAttribute('aria-invalid', 'true');
  });
});

test.describe('forms are registered for Netlify', () => {
  for (const [path, name] of [
    ['/contact/', 'contact'],
    ['/referrals/', 'referral-inquiry'],
    ['/sports/register/', 'sports-registration'],
  ] as const) {
    test(`${name} form has Netlify attributes and a honeypot`, async ({ page }) => {
      await page.goto(path);
      const form = page.locator(`form[name="${name}"]`);
      await expect(form).toHaveAttribute('data-netlify', 'true');
      await expect(form).toHaveAttribute('netlify-honeypot', 'bot-field');
      await expect(form).toHaveAttribute('action', '/thank-you/');
      await expect(form.locator('input[name="form-name"]')).toHaveValue(name);
      await expect(form.locator('input[name="bot-field"]')).toHaveCount(1);
    });
  }
});
