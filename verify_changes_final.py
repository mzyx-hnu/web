import asyncio
from playwright.async_api import async_playwright
import subprocess
import time

async def verify_changes():
    subprocess.run(["fuser", "-k", "8083/tcp"], stderr=subprocess.DEVNULL)
    server_process = subprocess.Popen(["npx", "http-server", "-p", "8083"], cwd="/app")
    time.sleep(2)

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()

        await page.goto("http://localhost:8083")

        # 1. Verify Top Status Bar shrinkage
        await page.screenshot(path="/app/verification/screenshots/top_status_bar.png")

        # 2. Verify Overlap Selector UI
        # Manually set an overlap state for testing
        await page.evaluate("""() => {
            const knight = STATE.friendlyUnits.find(u => u.type === 'knight');
            const swamp = STATE.terrainUnits.find(t => t.type === 'swamp');
            knight.row = swamp.row;
            knight.col = swamp.col;
            renderBoard();
        }""")

        # Click the swamp cell (5,5)
        await page.click('[data-row="5"][data-col="5"]')
        await asyncio.sleep(1)

        overlap_selector = page.locator('#overlap-selector')
        is_visible = await overlap_selector.is_visible()
        print(f"Overlap selector visible: {is_visible}")
        await page.screenshot(path="/app/verification/screenshots/overlap_selector.png")

        # Select Combat unit from overlap
        await page.click('#overlap-list button:has-text("骑士")')
        await asyncio.sleep(0.5)

        selected_panel = page.locator('#selected-panel')
        is_selected_visible = await selected_panel.is_visible()
        print(f"Selected panel visible after selection: {is_selected_visible}")

        # 3. Verify Dynamic Movement Range
        await page.evaluate("() => { resetGame(); }")
        await page.click('[data-row="1"][data-col="2"]') # Select knight

        # Force a move via script to ensure it happens
        await page.evaluate("""() => {
            const knight = STATE.friendlyUnits.find(u => u.type === 'knight');
            knight.row = 3;
            knight.col = 2;
            knight.remainingMove = 2;
            renderBoard();
        }""")

        # Check highlights
        # Cell (5,2) is dist 2 from (3,2). Should be highlighted.
        # Cell (6,2) is dist 3 from (3,2). Should NOT be highlighted.
        has_move_5_2 = await page.locator('[data-row="5"][data-col="2"]').evaluate("el => el.classList.contains('highlight-move')")
        has_move_6_2 = await page.locator('[data-row="6"][data-col="2"]').evaluate("el => el.classList.contains('highlight-move')")
        print(f"Cell (5,2) highlighted: {has_move_5_2}")
        print(f"Cell (6,2) highlighted: {has_move_6_2}")
        await page.screenshot(path="/app/verification/screenshots/movement_highlighting.png")

        # 4. Verify Skills unification
        skills_count = await page.locator('#skills-list button').count()
        print(f"Knight skills count: {skills_count}")

        # Check Editor unification
        await page.click('button:has-text("功能")')
        await page.click('#edit-mode-btn')
        await page.click('[data-row="3"][data-col="2"]')

        # Check skill management section
        has_ult_select = await page.locator('#edit-ult-skill').is_visible()
        print(f"Editor has ultimate skill selector: {has_ult_select}")
        await page.screenshot(path="/app/verification/screenshots/editor_unified_skills.png")

        await browser.close()

    server_process.terminate()

if __name__ == "__main__":
    asyncio.run(verify_changes())
