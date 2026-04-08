import { describe, it, expect, beforeEach, vi } from 'vitest';

// 在导入 script.js 之前模拟全局环境
const mockDocument = {
    getElementById: vi.fn().mockReturnValue({
        appendChild: vi.fn(),
        removeChild: vi.fn(),
        scrollTop: 0,
        scrollHeight: 0,
        children: []
    }),
    querySelector: vi.fn().mockReturnValue({
        getBoundingClientRect: vi.fn().mockReturnValue({ left: 0, top: 0, width: 50, height: 50 }),
        classList: { add: vi.fn(), remove: vi.fn() },
        style: {}
    }),
    createElement: vi.fn().mockReturnValue({
        style: {},
        classList: { add: vi.fn(), remove: vi.fn() },
        appendChild: vi.fn(),
        innerHTML: '',
        textContent: ''
    })
};

vi.stubGlobal('document', mockDocument);
vi.stubGlobal('window', {
    onload: null,
    innerWidth: 1024,
    innerHeight: 768
});
vi.stubGlobal('requestAnimationFrame', vi.fn());

// 现在可以导入 script.js 了
import {
    STATE,
    GAME_CONFIG,
    EFFECT_LIBRARY,
    createCombatUnit,
    getEffectiveAtk,
    getEffectiveDef,
    applyEffect,
    tickAllEffects,
    EFFECT_HANDLERS,
    calculateReachable,
    getEffectiveAtkRange,
    getEffectiveMoveRange,
    Skill
} from '../../script.js';

describe('战斗单位与属性测试', () => {
    beforeEach(() => {
        STATE.reset();
    });

    it('应当能正确创建战斗单位', () => {
        const base = { id: 'f1', type: 'knight', row: 1, col: 1 };
        const unit = createCombatUnit(base);
        expect(unit.name).toBe('骑士');
        expect(unit.hp).toBe(GAME_CONFIG.UNIT_TYPES.knight.hp);
        expect(unit.atk).toBe(GAME_CONFIG.UNIT_TYPES.knight.atk);
    });

    it('应当能计算正确的基础有效攻击力', () => {
        const unit = createCombatUnit({ id: 'f1', type: 'knight', row: 1, col: 1 });
        expect(getEffectiveAtk(unit)).toBe(unit.atk);
    });

    it('受到攻击强化状态时，攻击力应当提升', () => {
        const unit = createCombatUnit({ id: 'f1', type: 'knight', row: 1, col: 1 });
        applyEffect(unit, 'atkBuff');
        const modifier = EFFECT_LIBRARY.atkBuff.components.stats.atk;
        expect(getEffectiveAtk(unit)).toBe(unit.atk + modifier);
    });

    it('受到叠加状态时，数值应当翻倍（如果支持叠加）', () => {
        const unit = createCombatUnit({ id: 'f1', type: 'knight', row: 1, col: 1 });
        applyEffect(unit, 'atkBuff');
        applyEffect(unit, 'atkBuff'); // 叠加第二次
        const modifier = EFFECT_LIBRARY.atkBuff.components.stats.atk;
        expect(getEffectiveAtk(unit)).toBe(unit.atk + modifier * 2);
    });
});

describe('效果系统测试', () => {
    beforeEach(() => {
        STATE.reset();
    });

    it('中毒效果应当在 tick 时扣除生命值', () => {
        const unit = createCombatUnit({ id: 'f1', type: 'knight', row: 1, col: 1 });
        const initialHp = unit.hp;
        applyEffect(unit, 'poison');
        STATE.friendlyUnits.push(unit);

        tickAllEffects();

        const poisonDamage = EFFECT_LIBRARY.poison.components.tick.damage;
        expect(unit.hp).toBe(initialHp - poisonDamage);
    });

    it('效果持续时间结束后应当被移除', () => {
        const unit = createCombatUnit({ id: 'f1', type: 'knight', row: 1, col: 1 });
        applyEffect(unit, 'poison', 1); // 设置持续 1 回合
        STATE.friendlyUnits.push(unit);

        expect(unit.activeEffects.length).toBe(1);
        tickAllEffects();
        expect(unit.activeEffects.length).toBe(0);
    });

    it('光环应当影响范围内的单位', () => {
        const source = createCombatUnit({ id: 'f1', type: 'knight', row: 1, col: 1 });
        const target = createCombatUnit({ id: 'f2', type: 'archer', row: 1, col: 2 }); // 相邻

        STATE.friendlyUnits.push(source, target);

        // 骑士应用统帅光环
        applyEffect(source, 'commander');

        const atkMod = EFFECT_HANDLERS.getStatModifier(target, 'atk');
        expect(atkMod.total).toBe(EFFECT_LIBRARY.commander.components.aura.stats.atk);
    });
});

describe('技能系统测试', () => {
    it('蓝量足够时应当能使用技能', () => {
        const unit = createCombatUnit({ id: 'f1', type: 'knight', row: 1, col: 1 });
        unit.currentMana = 10;
        const skill = new Skill('test', { manaCost: 5 });
        expect(skill.canUse(unit)).toBe(true);
    });

    it('蓝量不足时应当不能使用技能', () => {
        const unit = createCombatUnit({ id: 'f1', type: 'knight', row: 1, col: 1 });
        unit.currentMana = 3;
        const skill = new Skill('test', { manaCost: 5 });
        expect(skill.canUse(unit)).toBe(false);
    });
});

describe('地图与移动逻辑测试', () => {
    beforeEach(() => {
        STATE.reset();
    });

    it('应当能正确计算可达范围（简单路径）', () => {
        const unit = createCombatUnit({ id: 'f1', type: 'knight', row: 0, col: 0 });
        unit.moveRange = 2;
        STATE.friendlyUnits.push(unit);

        const reachable = calculateReachable(0, 0, 2, unit);
        expect(reachable['1,1']).toBe(2);
        expect(reachable['2,1']).toBeUndefined();
    });

    it('遇到不可通行地形应当绕路', () => {
        const unit = createCombatUnit({ id: 'f1', type: 'knight', row: 0, col: 0 });
        unit.moveRange = 2;
        STATE.friendlyUnits.push(unit);

        STATE.terrainUnits.push({ id: 't1', type: 'mountain', row: 1, col: 0 });

        const reachable = calculateReachable(0, 0, 2, unit);
        expect(reachable['1,0']).toBeUndefined();
        expect(reachable['2,0']).toBeUndefined();
        expect(reachable['1,1']).toBe(2);
    });
});
