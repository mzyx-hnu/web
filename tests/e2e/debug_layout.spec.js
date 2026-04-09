import { test, expect } from '@playwright/test';

test('check board position on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone 8
    await page.goto('http://localhost:8080');

    // Wait for the game to initialize
    await page.waitForSelector('#board');

    const board = await page.locator('#board-container');
    const box = await board.boundingBox();
    console.log('Board Bounding Box:', box);

    // Check if it's in the upper half
    if (box) {
        const viewportHeight = 667;
        const boardBottom = box.y + box.height;
        console.log(`Board bottom: ${boardBottom}, Viewport half: ${viewportHeight / 2}`);
        if (boardBottom > viewportHeight / 2) {
            console.log('Board extends into the lower half!');
        } else {
            console.log('Board is within the upper half.');
        }
    }

    // Now open the info panel
    await page.click('.grid-cell:not(:empty)'); // Click a unit
    await page.waitForTimeout(500);

    const panel = await page.locator('#info-panel-wrapper');
    const panelBox = await panel.boundingBox();
    console.log('Panel Bounding Box:', panelBox);

    if (box && panelBox) {
        const overlap = box.y < panelBox.y + panelBox.height && box.y + box.height > panelBox.y;
        console.log(`Overlap detected: ${overlap}`);
    }

    await page.screenshot({ path: 'debug_mobile_pos.png' });
});
