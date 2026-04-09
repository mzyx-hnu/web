import asyncio
from playwright.async_api import async_playwright
import os
import subprocess
import time

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto("http://localhost:8081")

        # 1. Verify Top Status UI
        await page.screenshot(path="verification/screenshots/top_status.png")
        print("Captured top_status.png")

        # 2. Verify Skills (unified)
        await page.click('[data-row="1"][data-col="2"]') # Friendly Knight
        await page.screenshot(path="verification/screenshots/unit_selected.png")

        # 3. Verify Movement Bug
        await page.click('[data-row="1"][data-col="3"]')
        await asyncio.sleep(1)
        remaining_move = await page.inner_text("#selected-remaining-move")
        print(f"Remaining move after 1 step: {remaining_move}")
        await page.screenshot(path="verification/screenshots/remaining_move.png")

        # 4. Verify Overlap Selector using page.evaluate to force overlap
        await page.evaluate("""
            const knight = STATE.friendlyUnits.find(u => u.type === 'knight');
            knight.row = 2;
            knight.col = 7; // Forest at 2,7
            renderBoard();
        """)
        await asyncio.sleep(0.5)
        await page.click('[data-row="2"][data-col="7"]')
        await asyncio.sleep(0.5)

        is_visible = await page.is_visible("#overlap-selector")
        print(f"Overlap selector visible: {is_visible}")
        await page.screenshot(path="verification/screenshots/overlap_selector.png")

        if is_visible:
            # Click Terrain unit in selector
            # The selector contains buttons with text
            await page.click('#overlap-list button:has-text("地形单位")')
            await asyncio.sleep(0.5)
            team_text = await page.inner_text("#selected-team")
            print(f"Selected team after clicking terrain: {team_text}")

        # 5. Verify Editor Unified Skills
        await page.click('text="功能"')
        await page.click('text="进入编辑模式"')
        await page.click('[data-row="1"][data-col="5"]') # Archer
        await page.screenshot(path="verification/screenshots/editor_skills.png")
        print("Captured editor_skills.png")

        await browser.close()

if __name__ == "__main__":
    if not os.path.exists("verification/screenshots"):
        os.makedirs("verification/screenshots")

    # Kill any process on 8081
    subprocess.run("fuser -k 8081/tcp", shell=True)

    # Start server
    server = subprocess.Popen(["npx", "http-server", "-p", "8081"])
    time.sleep(2) # Give server time to start
    try:
        asyncio.run(run())
    finally:
        server.terminate()
