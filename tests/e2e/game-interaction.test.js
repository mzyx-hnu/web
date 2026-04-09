import { test, expect } from '@playwright/test';

test.describe('游戏基础交互', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // 等待棋盘上至少有一个单位加载
        await page.waitForSelector('.grid-cell[data-combat]', { timeout: 15000 });
    });

    test('页面应当能正确加载标题', async ({ page }) => {
        await expect(page).toHaveTitle(/战棋模拟器/);
    });

    test('点击棋盘格应当能选中单位并显示信息面板', async ({ page }) => {
        const knightCell = page.locator('.grid-cell[data-row="1"][data-col="2"]');
        await knightCell.click();

        const infoPanel = page.locator('#info-panel-wrapper');
        await expect(infoPanel).toHaveClass(/translate-y-0/);
        await expect(page.locator('#selected-name')).toHaveText('骑士');
    });

    test('回合切换逻辑测试', async ({ page }) => {
        const turnTeam = page.locator('#turn-team');
        await expect(turnTeam).toHaveText(/玩家回合/);

        await page.click('#end-turn-btn');
        // 结束回合后会切换到敌方回合，可能会有短暂延迟或动画
        await expect(turnTeam).toHaveText(/敌方回合/, { timeout: 10000 });
    });
});

test.describe('编辑器测试', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('.grid-cell[data-combat]', { timeout: 15000 });
        await page.evaluate(() => window.toggleEditMode());
    });

    test('应当能进入编辑模式并修改单位名称', async ({ page }) => {
        const knightCell = page.locator('.grid-cell[data-row="1"][data-col="2"]');
        await knightCell.click();

        const nameInput = page.locator('#edit-name');
        await nameInput.waitFor({ state: 'visible' });
        await nameInput.fill('超级骑士');
        await page.click('button:has-text("💾 保存全部修改")');

        const lastLog = page.locator('#log-container div').last();
        await expect(lastLog).toContainText('已保存');
        await expect(lastLog).toContainText('超级骑士');
    });

    test('应当能在空白格新增单位', async ({ page }) => {
        // (0,0) 应该是空的
        const emptyCell = page.locator('.grid-cell[data-row="0"][data-col="0"]');
        await emptyCell.click();

        // 等待新增按钮出现
        const addBtn = page.locator('button:has-text("新增友方单位")');
        await addBtn.waitFor({ state: 'visible' });
        await addBtn.click();

        await expect(emptyCell).toHaveAttribute('data-combat', /.+/);
    });
});
