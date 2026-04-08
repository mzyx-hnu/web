/**
 * ====================== 配置模块（GAME_CONFIG）======================
 * 只作为模板，所有单位/地形在创建时深度复制，实现完全独立编辑
 */
const GAME_CONFIG = {
    UNIT_TYPES: {
        knight:  { emoji: "⚔️", name: "骑士", hp: 22, atk: 9, def: 4, moveRange: 4, atkRange: 1, mana: 10, normalSkills: ["vampiricStrike", "shieldBash"], ultSkill: "commanderAura", isTerrain: false },
        archer:  { emoji: "🏹", name: "弓箭手", hp: 16, atk: 8, def: 2, moveRange: 3, atkRange: 2, mana: 12, normalSkills: ["precisionShot", "plagueBolt"], ultSkill: "ultimateStrike", isTerrain: false },
        heavy:   { emoji: "🛡️", name: "重甲战士", hp: 28, atk: 7, def: 7, moveRange: 2, atkRange: 1, mana: 8, normalSkills: ["shieldBash", "doubleStrike"], ultSkill: "ultimateStrike", isTerrain: false },
        mage:    { emoji: "🔥", name: "法师", hp: 15, atk: 11, def: 1, moveRange: 3, atkRange: 2, mana: 15, normalSkills: ["arcaneBlast", "precisionShot"], ultSkill: "ultimateStrike", isTerrain: false },
        mountain:{ emoji: "⛰️", name: "山峰", desc: "不可进入", impassable: true, isTerrain: true, temporary: false },
        river:   { emoji: "🌊", name: "河流", desc: "可进入，但穿过之后只能再移动1格", impassable: false, isTerrain: true, temporary: false, effectId: "riverSlow" },
        forest:  { emoji: "🌲", name: "森林", desc: "可进入，进入后移动和攻击范围减1（攻击最低1），外部单位只能相邻攻击森林内单位", impassable: false, isTerrain: true, temporary: false, effectId: "forestBuff" },
        manaPoint:{ emoji: "🔵", name: "回蓝点", desc: "踩踏后恢复5点蓝量", isTerrain: true, temporary: true, effect: "mana", value: 5 },
        healPoint:{ emoji: "❤️", name: "回血点", desc: "踩踏后恢复5点生命", isTerrain: true, temporary: true, effect: "heal", value: 5 },
        swamp: {
            emoji: "🟢",
            name: "毒沼",
            desc: "进入后中毒",
            isTerrain: true,
            temporary: false,
            effectId: "poison",        // 引用效果系统
            effectDuration: 4
        }
    },

    SKILLS: {
        doubleStrike: { emoji: "⚔️", name: "双重斩击", manaCost: 4, range: 1, damage: 15, desc: "近战高威力斩击" },
        precisionShot: { emoji: "🏹", name: "精准射击", manaCost: 3, range: 4, damage: 11, desc: "超远距离精准攻击" },
        arcaneBlast: { emoji: "🔥", name: "奥术冲击", manaCost: 5, range: 2, damage: 14, desc: "魔法爆炸伤害" },
        shieldBash: { emoji: "🛡️", name: "盾牌猛击", manaCost: 3, range: 1, damage: 9, desc: "坦克近战反击" },
        ultimateStrike: { emoji: "🌟", name: "终极审判", manaCost: 9, range: 3, damage: 25, desc: "消耗大量蓝量的终极一击" },

        // 复杂预设技能
        vampiricStrike: {
            emoji: "🦇", name: "吸血打击", manaCost: 5, range: 1, damage: 12,
            desc: "造成伤害并获得吸血状态",
            selfEffects: [{id: "lifesteal", duration: 3}]
        },
        holyShield: {
            emoji: "✨", name: "神圣护盾", manaCost: 4, range: 0, damage: 0,
            desc: "给自己施加防御强化",
            selfEffects: [{id: "defBuff", duration: 4}]
        },
        plagueBolt: {
            emoji: "🤢", name: "瘟疫箭", manaCost: 5, range: 3, damage: 7,
            desc: "使目标中毒并减速",
            targetEffects: [{id: "poison", duration: 3}, {id: "slow", duration: 2}]
        },
        commanderAura: {
            emoji: "🚩", name: "统帅集结", manaCost: 6, range: 0, damage: 0,
            desc: "获得 2 格范围的攻击强化光环",
            selfEffects: [{id: "commander", duration: 5}]
        }
    },

    INITIAL: {
        friendly: [{ id: "f1", type: "knight", row: 1, col: 2 }, { id: "f2", type: "archer", row: 1, col: 5 }],
        enemy: [{ id: "e1", type: "heavy", row: 8, col: 7 }, { id: "e2", type: "mage", row: 8, col: 3 }],
        terrain: [
            { id: "t1", type: "mountain", row: 3, col: 8 },
            { id: "t2", type: "mountain", row: 4, col: 9 },
            { id: "t3", type: "river", row: 5, col: 1 },
            { id: "t4", type: "river", row: 6, col: 2 },
            { id: "t5", type: "forest", row: 2, col: 7 },
            { id: "t6", type: "forest", row: 7, col: 4 },
            { id: "t7", type: "forest", row: 8, col: 5 },
            { id: "t8", type: "swamp", row: 5, col: 5 }
        ]
    },

    BOARD_SIZE: 10
};

/**
 * ====================== 【重构版】组件化效果系统 ======================
 */
const EFFECT_LIBRARY = {
    poison: {
        id: "poison", name: "中毒", emoji: "☠️", color: "emerald", duration: 3, stackable: true,
        desc: "每回合结束受到伤害，数值随层数叠加",
        components: { tick: { damage: 3 } }
    },
    burn: {
        id: "burn", name: "燃烧", emoji: "🔥", color: "rose", duration: 2, stackable: false,
        desc: "每回合结束受到较高伤害",
        components: { tick: { damage: 5 } }
    },
    slow: {
        id: "slow", name: "减速", emoji: "🐢", color: "cyan", duration: 2, stackable: true,
        desc: "移动范围减少",
        components: { stats: { move: -2 } }
    },
    stun: {
        id: "stun", name: "禁锢", emoji: "⛓️", color: "slate", duration: 1, stackable: false,
        desc: "无法移动和攻击",
        components: { inhibit: { move: true, attack: true } }
    },
    blind: {
        id: "blind", name: "致盲", emoji: "🌫️", color: "amber", duration: 2, stackable: true,
        desc: "攻击范围减少",
        components: { stats: { range: -1 } }
    },
    silence: {
        id: "silence", name: "沉默", emoji: "🔇", color: "violet", duration: 2, stackable: false,
        desc: "无法使用技能",
        components: { inhibit: { skill: true } }
    },
    regen: {
        id: "regen", name: "生命回复", emoji: "❤️", color: "emerald", duration: 3, stackable: true,
        desc: "每回合回复生命",
        components: { tick: { heal: 4 } }
    },
    atkBuff: {
        id: "atkBuff", name: "攻击强化", emoji: "⚔️", color: "amber", duration: 3, stackable: true,
        desc: "攻击力提升",
        components: { stats: { atk: 4 } }
    },
    defBuff: {
        id: "defBuff", name: "防御强化", emoji: "🛡️", color: "sky", duration: 3, stackable: true,
        desc: "防御力提升",
        components: { stats: { def: 3 } }
    },
    commander: {
        id: "commander", name: "统帅光环", emoji: "🚩", color: "indigo", duration: 99, stackable: false,
        desc: "增加周围 2 格友军 5 点攻击力",
        components: { aura: { range: 2, target: "ally", stats: { atk: 5 } } }
    },
    thorns: {
        id: "thorns", name: "荆棘", emoji: "🌵", color: "lime", duration: 3, stackable: false,
        desc: "受到近战攻击时，反弹 4 点伤害",
        components: { trigger: { onDefend: "thornsEffect" } }
    },
    lifesteal: {
        id: "lifesteal", name: "吸血", emoji: "🧛", color: "rose", duration: 3, stackable: false,
        desc: "攻击造成伤害时，回复 50% 伤害量的生命值",
        components: { trigger: { onAttack: "lifestealEffect" } }
    },
    manaAura: {
        id: "manaAura", name: "法力泉涌", emoji: "💎", color: "cyan", duration: 99, stackable: false,
        desc: "周围 1 格的友军禁止使用技能（测试光环禁用）",
        components: { aura: { range: 1, target: "ally", inhibit: { skill: true } } }
    },
    berserk: {
        id: "berserk", name: "狂暴", emoji: "💢", color: "rose", duration: 2, stackable: true,
        desc: "大幅提升攻击力(+8)，但防御力大幅下降(-5)",
        components: { stats: { atk: 8, def: -5 } }
    },
    forestBuff: {
        id: "forestBuff", name: "森林隐蔽", emoji: "🌲", color: "emerald", duration: 99, stackable: false,
        desc: "处于森林中，移动和攻击范围减1，且外部单位只能相邻攻击（限位组件）",
        components: {
            stats: { move: -1, range: -1 },
            protect: { limitRange: 1 } // 新组件：限制攻击者距离
        }
    },
    riverSlow: {
        id: "riverSlow", name: "河流阻力", emoji: "🌊", color: "sky", duration: 99, stackable: false,
        desc: "处于河流中，移动力大幅受限",
        components: { stats: { move: -3 } } // 模拟限移 1 格的效果
    }
};

/**
 * 效果组件处理器 - 预留接口，支持未来通过代码注册新组件
 */
const COMPONENT_PROCESSORS = {
    tick: (unit, eff, params) => {
        const stacks = eff.stacks || 1;
        if (params.damage) {
            const dmg = params.damage * stacks;
            unit.hp = Math.max(0, unit.hp - dmg);
            addLog(`${unit.emoji} 受到 ${dmg} 点 <span class="text-rose-400">持续伤害</span>`, "rose");
        }
        if (params.heal) {
            const heal = params.heal * stacks;
            unit.hp = Math.min(unit.maxHp, unit.hp + heal);
            addLog(`${unit.emoji} 获得 ${heal} 点 <span class="text-emerald-400">持续治疗</span>`, "emerald");
        }
    },
    stats: (unit, eff, params, statName) => {
        const stacks = eff.stacks || 1;
        return params[statName] ? params[statName] * stacks : 0;
    },
    inhibit: (unit, eff, params, action) => {
        return params[action] || false;
    },
    trigger: (unit, eff, params, event, data) => {
        const handlers = {
            thornsEffect: (u, d) => {
                if (d.attacker && d.range === 1) {
                    d.attacker.hp = Math.max(0, d.attacker.hp - 4);
                    addLog(`🌵 荆棘反伤！对 ${d.attacker.emoji} 造成 4 点伤害`, "lime");
                    AnimationManager.showDamagePopup(4, d.attacker.row, d.attacker.col);
                }
            },
            lifestealEffect: (u, d) => {
                if (d.damageDealt > 0) {
                    const heal = Math.floor(d.damageDealt * 0.5);
                    u.hp = Math.min(u.maxHp, u.hp + heal);
                    addLog(`🧛 吸血！回复 ${heal} 点生命`, "rose");
                }
            }
        };
        const funcName = params[event];
        if (funcName && handlers[funcName]) handlers[funcName](unit, data);
    }
};

/**
 * 效果处理器核心
 */
const EFFECT_HANDLERS = {
    // 统一获取配置（如果实例有自定义组件则用实例的，否则用库模板的）
    getConfig(eff) {
        const template = EFFECT_LIBRARY[eff.id] || {};
        return {
            name: eff.name || template.name || "未知状态",
            emoji: eff.emoji || template.emoji || "✨",
            color: eff.color || template.color || "slate",
            desc: eff.desc || template.desc || "",
            duration: eff.duration !== undefined ? eff.duration : template.duration,
            stackable: eff.stackable !== undefined ? eff.stackable : template.stackable,
            components: eff.components || template.components || {}
        };
    },

    tick(unit, eff) {
        const config = this.getConfig(eff);
        if (config.components.tick) {
            COMPONENT_PROCESSORS.tick(unit, eff, config.components.tick);
        }
    },

    /**
     * 获取属性修正及来源
     */
    getStatModifier(unit, stat) {
        const sources = [];
        let total = 0;

        // 1. 基础状态 (Active Effects)
        if (unit.activeEffects) {
            unit.activeEffects.forEach(eff => {
                const config = this.getConfig(eff);
                if (config.components.stats) {
                    const mod = COMPONENT_PROCESSORS.stats(unit, eff, config.components.stats, stat);
                    if (mod !== 0) {
                        total += mod;
                        sources.push({ name: config.name, icon: config.emoji, value: mod, type: "effect" });
                    }
                }
            });
        }

        // 2. 光环 (Dynamic Auras)
        const auras = this.calculateAurasForUnit(unit);
        auras.forEach(aura => {
            if (aura.stats && aura.stats[stat]) {
                total += aura.stats[stat];
                sources.push({ name: aura.sourceName, icon: aura.icon, value: aura.stats[stat], type: "aura" });
            }
        });

        return { total, sources };
    },

    isDisabled(unit, action) {
        // 状态限制
        const fromEffects = (unit.activeEffects || []).some(eff => {
            const config = this.getConfig(eff);
            return config.components.inhibit && COMPONENT_PROCESSORS.inhibit(unit, eff, config.components.inhibit, action);
        });
        if (fromEffects) return true;

        // 光环限制
        const auras = this.calculateAurasForUnit(unit);
        return auras.some(aura => aura.inhibit && aura.inhibit[action]);
    },

    /**
     * 获取保护组件 (例如森林的射程限制)
     */
    getProtection(target) {
        const auras = this.calculateAurasForUnit(target);
        let minLimit = Infinity;
        auras.forEach(aura => {
            if (aura.protect && aura.protect.limitRange !== undefined) {
                minLimit = Math.min(minLimit, aura.protect.limitRange);
            }
        });
        return minLimit === Infinity ? null : minLimit;
    },

    trigger(unit, event, data) {
        if (!unit.activeEffects) return;
        unit.activeEffects.forEach(eff => {
            const config = this.getConfig(eff);
            if (config.components.trigger) {
                COMPONENT_PROCESSORS.trigger(unit, eff, config.components.trigger, event, data);
            }
        });
    },

    calculateAurasForUnit(target) {
        const activeAuras = [];
        const allEntities = [...STATE.friendlyUnits, ...STATE.enemyUnits, ...STATE.terrainUnits];
        const targetTeam = STATE.friendlyUnits.includes(target) ? "friendly" : "enemy";

        allEntities.forEach(source => {
            // 如果是战斗单位，死亡则无光环；如果是自己，通常不吃自己的光环（除非特殊定义）
            if (source.hp !== undefined && source.hp <= 0) return;
            if (source === target && !source.isTerrain) return;

            const sourceTeam = STATE.friendlyUnits.includes(source) ? "friendly" : (STATE.enemyUnits.includes(source) ? "enemy" : "terrain");

            // 处理普通单位的效果光环
            source.activeEffects?.forEach(eff => {
                const config = this.getConfig(eff);
                const aura = config.components.aura;
                if (aura) {
                    const dist = Math.abs(source.row - target.row) + Math.abs(source.col - target.col);
                    if (dist <= aura.range) {
                        let match = this.checkAuraMatch(aura.target, sourceTeam, targetTeam);
                        if (match) {
                            activeAuras.push({
                                id: eff.id,
                                sourceName: source.name,
                                icon: config.emoji,
                                stats: aura.stats,
                                inhibit: aura.inhibit,
                                protect: aura.protect
                            });
                        }
                    }
                }
            });

            // 处理地形自带的光环 (非触发型)
            if (source.isTerrain && source.effectId && !source.effectIsTrigger) {
                const terrainEff = source.effectConfig || { id: source.effectId };
                const config = this.getConfig(terrainEff);
                if (source.row === target.row && source.col === target.col) {
                    activeAuras.push({
                        id: config.id,
                        sourceName: source.name,
                        icon: config.emoji,
                        stats: config.components.stats,
                        inhibit: config.components.inhibit,
                        protect: config.components.protect
                    });
                }
            }
        });
        return activeAuras;
    },

    checkAuraMatch(auraTarget, sourceTeam, targetTeam) {
        if (auraTarget === "all") return true;
        if (sourceTeam === "terrain") return true; // 地形对所有人有效（或由地形定义决定，暂定全员）
        if (auraTarget === "ally" && sourceTeam === targetTeam) return true;
        if (auraTarget === "enemy" && sourceTeam !== targetTeam) return true;
        return false;
    },
};

/**
 * 应用效果
 * @param {Object} unit 目标单位
 * @param {string|Object} effectData 效果ID或完整效果配置对象
 * @param {number} customDuration 可选持续回合
 */
function applyEffect(unit, effectData, customDuration = null) {
    if (!unit.activeEffects) unit.activeEffects = [];

    // 如果是对象，则视为实例副本；如果是字符串，则视为引用 ID
    let effectInstance;
    if (typeof effectData === 'string') {
        const template = EFFECT_LIBRARY[effectData];
        if (!template) return;
        effectInstance = { id: effectData };
    } else {
        effectInstance = JSON.parse(JSON.stringify(effectData)); // 深度复制实例
    }

    const config = EFFECT_HANDLERS.getConfig(effectInstance);
    const effectId = effectInstance.id;

    // 检查是否已有同名/同ID效果
    const existing = unit.activeEffects.find(e => e.id === effectId);
    if (existing) {
        if (config.stackable) {
            existing.stacks = (existing.stacks || 1) + 1;
            addLog(`${unit.emoji} ${unit.name} 的 ${config.name} 叠加至 <span class="font-bold">${existing.stacks}</span> 层`, config.color);
        }
        existing.remainingTurns = Math.max(existing.remainingTurns, customDuration !== null ? customDuration : config.duration);
    } else {
        effectInstance.stacks = 1;
        effectInstance.remainingTurns = customDuration !== null ? customDuration : config.duration;
        unit.activeEffects.push(effectInstance);
        addLog(`${unit.emoji} ${unit.name} 获得 <span class="text-${config.color}-400">${config.emoji} ${config.name}</span>`, config.color);
    }
}

function tickAllEffects() {
    [...STATE.friendlyUnits, ...STATE.enemyUnits].forEach(unit => {
        if (!unit.activeEffects || unit.hp <= 0) return;

        for (let i = unit.activeEffects.length - 1; i >= 0; i--) {
            const eff = unit.activeEffects[i];
            EFFECT_HANDLERS.tick(unit, eff);

            eff.remainingTurns--;
            if (eff.remainingTurns <= 0) {
                unit.activeEffects.splice(i, 1);
                const template = EFFECT_LIBRARY[eff.id];
                addLog(`${unit.emoji} 的 ${template.name} 效果消失`, "slate");
            }
        }
    });
}

function getEffectiveAtk(unit) { return unit.atk + EFFECT_HANDLERS.getStatModifier(unit, "atk").total; }
function getEffectiveDef(unit) { return unit.def + EFFECT_HANDLERS.getStatModifier(unit, "def").total; }
function getEffectiveMoveRange(unit) { return Math.max(0, unit.moveRange + EFFECT_HANDLERS.getStatModifier(unit, "move").total); }
function getEffectiveAtkRange(unit) { return Math.max(1, unit.atkRange + EFFECT_HANDLERS.getStatModifier(unit, "range").total); }

/**
 * 【架构重构】GameState 类 - 统一管理所有游戏状态
 * 方便后续添加 Undo/Redo、保存/加载等功能
 */
class GameState {
    constructor() {
        this.friendlyUnits = [];
        this.enemyUnits = [];
        this.terrainUnits = [];
        this.currentTurn = "player";
        this.turnCount = 1;
        this.selected = null;        // {team, id}
        this.selectedSkill = null;
        this.editMode = false;
        this.editingUnit = null;     // {team, id, isTerrain, pendingAdd, row, col, pendingCopy, sourceId}
        this.editingSkillId = null;
        this.previewTimeout = null;
        this.editorHistory = [];     // 存储渲染函数的引用或状态对象
    }

    reset() {
        this.friendlyUnits = [];
        this.enemyUnits = [];
        this.terrainUnits = [];
        this.currentTurn = "player";
        this.turnCount = 1;
        this.selected = null;
        this.selectedSkill = null;
        this.editMode = false;
        this.editingUnit = null;
        this.editingSkillId = null;
        this.previewTimeout = null;
        this.editorHistory = [];
    }
}

// 全局实例（替代原来的 STATE）
let STATE = new GameState();

/**
 * 【架构重构】AnimationManager 单例 - 统一管理所有动画
 */
const AnimationManager = {
    getCellCenter(row, col) {
        const cell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
        if (!cell) return { x: 0, y: 0 };
        const rect = cell.getBoundingClientRect();
        return {
            x: Math.round(rect.left + rect.width / 2),
            y: Math.round(rect.top + rect.height / 2)
        };
    },

    createFlyer(emoji, size = "2.7rem", z = 9999) {
        const flyer = document.createElement("div");
        flyer.style.position = "fixed";
        flyer.style.fontSize = size;
        flyer.style.zIndex = z;
        flyer.style.pointerEvents = "none";
        flyer.style.willChange = "transform, opacity";
        flyer.style.transform = "translate(-50%, -50%)";
        flyer.textContent = emoji;
        document.body.appendChild(flyer);
        return flyer;
    },

    animateMove(fromRow, fromCol, toRow, toCol, emoji) {
        const start = this.getCellCenter(fromRow, fromCol);
        const end = this.getCellCenter(toRow, toCol);
        const flyer = this.createFlyer(emoji, "2.7rem", 9999);
        flyer.style.left = `${start.x}px`;
        flyer.style.top = `${start.y}px`;
        flyer.style.filter = "drop-shadow(0 12px 20px rgb(16 185 129))";

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {   // 双帧强制重绘，解决高缩放下首次渲染偏差
                flyer.style.transition = "all 580ms cubic-bezier(0.34, 1.56, 0.64, 1)";
                flyer.style.left = `${end.x}px`;
                flyer.style.top = `${end.y}px`;
            });
        });

        setTimeout(() => {
            flyer.style.transition = "all 220ms ease";
            flyer.style.opacity = "0";
            flyer.style.transform = "translate(-50%, -50%) scale(0.65)";
            setTimeout(() => flyer.remove(), 280);
        }, 630);
    },

    animateMeleeBump(attackerRow, attackerCol, defenderRow, defenderCol, emoji) {
        const start = this.getCellCenter(attackerRow, attackerCol);
        const end = this.getCellCenter(defenderRow, defenderCol);
        const flyer = this.createFlyer(emoji, "2.85rem", 9999);
        flyer.style.left = `${start.x}px`;
        flyer.style.top = `${start.y}px`;

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                flyer.style.transition = "all 380ms cubic-bezier(0.68, -0.55, 0.27, 1.55)";
                flyer.style.left = `${end.x}px`;
                flyer.style.top = `${end.y}px`;
                flyer.style.transform = "translate(-50%, -50%) scale(1.42)";
            });
        });

        setTimeout(() => {
            flyer.style.transition = "all 340ms cubic-bezier(0.68, -0.55, 0.27, 1.55)";
            flyer.style.left = `${start.x}px`;
            flyer.style.top = `${start.y}px`;
            flyer.style.transform = "translate(-50%, -50%) scale(1)";
        }, 430);

        setTimeout(() => flyer.remove(), 1050);
    },

    animateProjectile(startRow, startCol, endRow, endCol, emoji) {
        const start = this.getCellCenter(startRow, startCol);
        const end = this.getCellCenter(endRow, endCol);
        const flyer = this.createFlyer(emoji, "2.25rem", 9998);
        flyer.style.left = `${start.x}px`;
        flyer.style.top = `${start.y}px`;
        flyer.style.filter = "drop-shadow(8px 8px 16px rgb(165 243 252))";

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                flyer.style.transition = "all 680ms cubic-bezier(0.25, 0.46, 0.45, 0.94)";
                flyer.style.left = `${end.x}px`;
                flyer.style.top = `${end.y}px`;
            });
        });

        setTimeout(() => {
            flyer.style.opacity = "0";
            flyer.style.transform = "translate(-50%, -50%) scale(0.7)";
            setTimeout(() => flyer.remove(), 220);
        }, 730);
    },

    showSkillNamePopup(name, row, col) {
        const center = this.getCellCenter(row, col);
        const popup = document.createElement("div");
        popup.style.position = "fixed";
        popup.style.left = `${center.x}px`;
        popup.style.top = `${center.y}px`;
        popup.style.transform = "translate(-50%, -50%)";
        popup.style.background = "rgba(165, 243, 252, 0.96)";
        popup.style.color = "#0f172a";
        popup.style.padding = "8px 22px";
        popup.style.borderRadius = "9999px";
        popup.style.fontSize = "15.5px";
        popup.style.fontWeight = "700";
        popup.style.whiteSpace = "nowrap";
        popup.style.boxShadow = "0 0 30px 10px rgb(165 243 252)";
        popup.style.opacity = "0";
        popup.style.transition = "all 280ms cubic-bezier(0.4, 0, 0.2, 1)";
        popup.style.zIndex = "10000";
        popup.textContent = name;
        document.body.appendChild(popup);

        requestAnimationFrame(() => requestAnimationFrame(() => popup.style.opacity = "1"));

        setTimeout(() => {
            popup.style.opacity = "0";
            popup.style.transform = "translate(-50%, -72%)";
            setTimeout(() => popup.remove(), 340);
        }, 1150);
    },

    showDamagePopup(damage, row, col, isCritical = false) {
        const center = this.getCellCenter(row, col);

        const popup = document.createElement("div");
        popup.style.position = "fixed";
        popup.style.left = `${center.x}px`;
        popup.style.top = `${center.y - 20}px`;   // 起始位置稍靠上
        popup.style.transform = "translate(-50%, -50%)";
        popup.style.fontSize = isCritical ? "2.4rem" : "2.1rem";
        popup.style.fontWeight = "900";
        popup.style.color = isCritical ? "#f59e0b" : "#f87171";
        popup.style.textShadow = isCritical
            ? "0 0 20px #f59e0b, 0 0 30px #f59e0b"
            : "0 0 15px #f87171";
        popup.style.zIndex = "99999";
        popup.style.pointerEvents = "none";
        popup.style.opacity = "1";
        popup.style.transition = "all 900ms cubic-bezier(0.4, 0, 0.2, 1)";
        popup.textContent = `-${damage}`;

        document.body.appendChild(popup);

        // 动画：向上飘 + 淡出 + 轻微放大
        requestAnimationFrame(() => {
            popup.style.top = `${center.y - 85}px`;
            popup.style.opacity = "0";
            popup.style.transform = "translate(-50%, -50%) scale(1.15)";
        });

        // 清理
        setTimeout(() => popup.remove(), 950);
    }
};

/**
 * 【架构重构】Skill 类 - 为未来 Buff/Debuff 做准备
 */
class Skill {
    constructor(id, config) {
        this.id = id;
        Object.assign(this, config); // emoji, name, manaCost, range, damage, desc
    }

    canUse(unit) {
        return unit.currentMana >= this.manaCost;
    }
}

// 把 GAME_CONFIG.SKILLS 转换为 Skill 实例（在 initGame 前调用）
function initializeSkills() {
    Object.keys(GAME_CONFIG.SKILLS).forEach(key => {
        GAME_CONFIG.SKILLS[key] = new Skill(key, GAME_CONFIG.SKILLS[key]);
    });
}

/**
 * 【性能优化】格子 DOM 缓存
 * 所有格子只创建一次，后续只更新属性
 */
let cellCache = new Map(); // key: `${row},${col}` → DOM 元素

/* ====================== 辅助函数（保持不变） ====================== */
function addLog(message, color = "slate") {
    const container = document.getElementById("log-container");
    const div = document.createElement("div");
    div.className = `px-3 py-2 rounded-xl bg-slate-800/50 border-l-4 border-${color}-400`;
    div.innerHTML = `<span class="font-mono text-[10px] text-slate-400">[${STATE.turnCount}]</span> ${message}`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    if (container.children.length > 9) container.removeChild(container.children[0]);
}

function getUnit(team, id) {
    if (team === "terrain") return STATE.terrainUnits.find(u => u.id === id);
    return STATE[team + "Units"].find(u => u.id === id);
}

function createCombatUnit(base) {
    const template = GAME_CONFIG.UNIT_TYPES[base.type];
    return {
        id: base.id,
        type: base.type,
        row: base.row,
        col: base.col,
        emoji: template.emoji,
        name: template.name,
        hp: template.hp,
        maxHp: template.hp,
        atk: template.atk,
        def: template.def,
        moveRange: template.moveRange,
        atkRange: template.atkRange,
        mana: template.mana,
        maxMana: template.mana,
        currentMana: template.mana,
        normalSkills: [...(template.normalSkills || [])],
        ultSkill: template.ultSkill,
        remainingMove: template.moveRange,
        hasAttacked: false,
        forestModifier: false,
        skillUsedThisTurn: false,
        activeEffects: []
    };
}

function isInRange(unit, targetRow, targetCol, range) {
    const manhattan = Math.abs(unit.row - targetRow) + Math.abs(unit.col - targetCol);

    // 检查目标是否有保护状态 (如森林)
    const { combatUnit } = getCellContent(targetRow, targetCol);
    if (combatUnit) {
        const limit = EFFECT_HANDLERS.getProtection(combatUnit);
        if (limit !== null && manhattan > limit) return false;
    }

    return manhattan <= range;
}

function getCellContent(row, col) {
    let combatUnit = null, combatTeam = null;
    for (let u of STATE.friendlyUnits) if (u.hp > 0 && u.row === row && u.col === col) { combatUnit = u; combatTeam = "friendly"; break; }
    if (!combatUnit) for (let u of STATE.enemyUnits) if (u.hp > 0 && u.row === row && u.col === col) { combatUnit = u; combatTeam = "enemy"; break; }
    const terrainUnit = STATE.terrainUnits.find(t => t.row === row && t.col === col);
    return { combatUnit, combatTeam, terrainUnit };
}

/**
 * 强制刷新动画层（防止残留）
 */
function clearAnimationOverlay() {
    const overlay = document.getElementById("animation-overlay");
    if (overlay) overlay.innerHTML = "";
}

/**
 * 获取所有预设地形模板（用于新增/切换地形）
 */
function getTerrainPresets() {
    return Object.keys(GAME_CONFIG.UNIT_TYPES)
        .filter(key => GAME_CONFIG.UNIT_TYPES[key].isTerrain)
        .map(key => ({
            type: key,
            ...GAME_CONFIG.UNIT_TYPES[key]
        }));
}

/**
 * 【移动端触屏优化】长按格子 600ms 自动选中/查看详情
 * 兼容桌面点击（click 事件不受影响）
 */
let longPressTimer = null;
let longPressRow = null;
let longPressCol = null;

function addLongPressSupport(cell, row, col) {
    // 防止重复绑定
    if (cell.dataset.hasLongPress === "true") return;
    cell.dataset.hasLongPress = "true";

    // touchstart 开始计时
    cell.addEventListener("touchstart", (e) => {
        longPressRow = row;
        longPressCol = col;
        longPressTimer = setTimeout(() => {
            // 长按触发
            handleLongPress(row, col);
        }, 600); // 600ms 长按阈值
    });

    // touchend / touchcancel 取消计时
    const cancel = () => {
        if (longPressTimer) clearTimeout(longPressTimer);
        longPressTimer = null;
    };
    cell.addEventListener("touchend", cancel);
    cell.addEventListener("touchcancel", cancel);
    cell.addEventListener("touchmove", cancel); // 手指移动也取消
}

/**
 * 长按后的实际处理逻辑
 */
function handleLongPress(row, col) {
    const { combatUnit, combatTeam, terrainUnit } = getCellContent(row, col);

    if (combatUnit) {
        selectUnit(combatTeam, combatUnit.id);
        // 移动端额外振动反馈（可选）
        if (navigator.vibrate) navigator.vibrate(30);
    } else if (terrainUnit) {
        selectUnit("terrain", terrainUnit.id);
        if (navigator.vibrate) navigator.vibrate(20);
    } else {
        // 空白格长按：仅在编辑模式下触发新增提示
        if (STATE.editMode) {
            addLog(`📍 长按空白格 (${row},${col}) → 可新增单位`, "purple");
        }
    }
}

/* ====================== 棋盘渲染（性能优化版 · 缓存 + 差异更新） ====================== */
function renderBoard() {
    const boardEl = document.getElementById("board");

    if (cellCache.size === 0) {
        boardEl.innerHTML = "";
        for (let r = 0; r < GAME_CONFIG.BOARD_SIZE; r++) {
            for (let c = 0; c < GAME_CONFIG.BOARD_SIZE; c++) {
                const cell = document.createElement("div");
                cell.className = `grid-cell unit-cell bg-slate-800/40 hover:bg-slate-700/60 border border-white/5 rounded-xl sm:rounded-2xl cursor-pointer relative transition-all`;
                cell.dataset.row = r;
                cell.dataset.col = c;
                cell.addEventListener("click", () => handleCellClick(r, c));

                const key = `${r},${c}`;
                cellCache.set(key, cell);
                boardEl.appendChild(cell);

                if (!cell.dataset.hasLongPress) addLongPressSupport(cell, r, c);
            }
        }
    }

    // 更新格子
    for (let r = 0; r < GAME_CONFIG.BOARD_SIZE; r++) {
        for (let c = 0; c < GAME_CONFIG.BOARD_SIZE; c++) {
            const cell = cellCache.get(`${r},${c}`);
            if (cell) updateCellContent(cell, r, c);
        }
    }

    if (STATE.selected) highlightRanges();
}

/**
 * 单格内容更新（已修复多格高亮 + 残留问题）
 */
function updateCellContent(cell, row, col) {
    const { combatUnit, combatTeam, terrainUnit } = getCellContent(row, col);

    // 【关键】每次都先清除所有可能的高亮类
    cell.classList.remove(
        "highlight-move", "highlight-attack", "highlight-overlap",
        "highlight-skill", "highlight-edit"
    );
    cell.style.boxShadow = "";   // 清除自定义阴影

    // 清理旧的状态图标容器
    const oldStatus = cell.querySelector(".status-icons-container");
    if (oldStatus) oldStatus.remove();

    // 战斗单位
    if (combatUnit) {
        cell.setAttribute("data-combat", combatUnit.emoji);
        cell.style.background = combatTeam === "friendly"
            ? "rgba(16, 185, 129, 0.12)"
            : "rgba(239, 68, 68, 0.12)";

        // 状态图标显示逻辑 (纵向循环滚动)
        if (combatUnit.activeEffects && combatUnit.activeEffects.length > 0) {
            const container = document.createElement("div");
            container.className = "status-icons-container";
            container.style.pointerEvents = "auto"; // 允许点击图标查看详情
            cell.appendChild(container);

            const effects = combatUnit.activeEffects;
            let currentIndex = 0;

            const updateIcons = () => {
                if (!cell.contains(container)) return; // 单元格已刷新，停止循环
                container.innerHTML = "";
                const eff = effects[currentIndex];
                const config = EFFECT_HANDLERS.getConfig(eff);
                if (config) {
                    const wrapper = document.createElement("div");
                    wrapper.className = "status-icon-wrapper active";
                    wrapper.innerHTML = `<span>${config.emoji}</span>${eff.stacks > 1 ? `<span class="status-stacks">${eff.stacks}</span>` : ""}`;
                    wrapper.onclick = (e) => {
                        e.stopPropagation();
                        showStatusDetail(e, eff);
                    };
                    container.appendChild(wrapper);
                }

                if (effects.length > 1) {
                    cell.dataset.statusTimer = setTimeout(() => {
                        const active = container.querySelector(".status-icon-wrapper");
                        if (active) {
                            active.classList.remove("active");
                            active.classList.add("exit");
                        }
                        currentIndex = (currentIndex + 1) % effects.length;
                        cell.dataset.statusTimer = setTimeout(updateIcons, 500);
                    }, 2500);
                }
            };
            if (cell.dataset.statusTimer) clearTimeout(parseInt(cell.dataset.statusTimer));
            updateIcons();
        }
    } else {
        cell.removeAttribute("data-combat");
        cell.style.background = "";
    }

    // 地形
    if (terrainUnit) {
        cell.setAttribute("data-terrain", terrainUnit.emoji || "❓");
        if (!combatUnit) {
            const type = terrainUnit.type;
            if (type === "mountain") cell.style.background = "rgba(71, 85, 105, 0.4)";
            else if (type === "river") cell.style.background = "rgba(56, 189, 248, 0.2)";
            else if (type === "forest") cell.style.background = "rgba(134, 239, 172, 0.2)";
        }
    } else {
        cell.removeAttribute("data-terrain");
    }

    // ==================== 编辑模式高亮 ====================
    if (STATE.editMode && STATE.editingUnit) {
        let isTarget = false;

        if (STATE.editingUnit.pendingAdd) {
            // 空白格新增模式：只高亮当前点击的那一个格子
            isTarget = (row === STATE.editingUnit.row && col === STATE.editingUnit.col);
        }
        else {
            // 编辑已有单位/地形
            isTarget =
                (STATE.editingUnit.team === combatTeam &&
                STATE.editingUnit.id === (combatUnit ? combatUnit.id : null)) ||
                (STATE.editingUnit.team === "terrain" &&
                terrainUnit && STATE.editingUnit.id === terrainUnit.id);
        }

        if (isTarget) {
            cell.classList.add("highlight-edit");
        }
    }
}

/* ====================== 高亮逻辑（保持不变） ====================== */
function highlightRanges() {
    const cells = document.querySelectorAll(".grid-cell");
    const sel = STATE.selected;
    if (!sel) return;
    const entity = getUnit(sel.team, sel.id);
    if (!entity || sel.team === "terrain") return;

    if (STATE.selectedSkill) {
        highlightSkillRange(entity, STATE.selectedSkill);
        return;
    }

    let maxMove = (sel.team === "friendly") ? entity.remainingMove : getEffectiveMoveRange(entity);
    if (maxMove <= 0) maxMove = 0;
    const reachable = calculateReachable(entity.row, entity.col, maxMove, entity);

    let effectiveAtk = getEffectiveAtkRange(entity);
    if (effectiveAtk <= 0) effectiveAtk = 0;

    const hasActionLeft = sel.team === "friendly" ? !entity.hasAttacked : true;

    cells.forEach(cell => {
        const r = parseInt(cell.dataset.row), c = parseInt(cell.dataset.col);
        cell.classList.remove("highlight-move", "highlight-attack", "highlight-overlap", "highlight-skill");

        const key = `${r},${c}`;
        const dist = reachable[key];
        const isMove = (maxMove > 0 && dist !== undefined && dist > 0);

        let canAttack = hasActionLeft && isInRange(entity, r, c, effectiveAtk);

        if (isMove && canAttack) cell.classList.add("highlight-overlap");
        else if (isMove) cell.classList.add("highlight-move");
        else if (canAttack) cell.classList.add("highlight-attack");
    });
}

function highlightSkillRange(unit, skillId) {
    const skill = GAME_CONFIG.SKILLS[skillId];
    if (!skill) return;
    const cells = document.querySelectorAll(".grid-cell");
    cells.forEach(cell => {
        const r = parseInt(cell.dataset.row), c = parseInt(cell.dataset.col);
        cell.classList.remove("highlight-move", "highlight-attack", "highlight-overlap", "highlight-skill");
        if (isInRange(unit, r, c, skill.range)) {
            cell.classList.add("highlight-skill");
        }
    });
}

function calculateReachable(startRow, startCol, maxMove, unit) {
    const directions = [[-1,0],[1,0],[0,-1],[0,1]];
    const distMap = {};
    const queue = [{r: startRow, c: startCol, dist: 0}];
    const visited = new Set();
    visited.add(`${startRow},${startCol}`);
    distMap[`${startRow},${startCol}`] = 0;

    let effectiveMax = maxMove;
    if (unit && unit.forestModifier) effectiveMax = Math.max(0, maxMove - 1);

    while (queue.length > 0) {
        const {r, c, dist} = queue.shift();
        if (dist >= effectiveMax) continue;
        for (let [dr, dc] of directions) {
            const nr = r + dr, nc = c + dc;
            if (nr < 0 || nr >= GAME_CONFIG.BOARD_SIZE || nc < 0 || nc >= GAME_CONFIG.BOARD_SIZE) continue;
            const key = `${nr},${nc}`;
            if (visited.has(key)) continue;

            let blocked = false;
            [...STATE.friendlyUnits, ...STATE.enemyUnits].forEach(u => {
                if (u.hp > 0 && u.row === nr && u.col === nc) blocked = true;
            });
            const terrain = STATE.terrainUnits.find(t => t.row === nr && t.col === nc);
            if (terrain && GAME_CONFIG.UNIT_TYPES[terrain.type] && GAME_CONFIG.UNIT_TYPES[terrain.type].impassable) blocked = true;

            if (!blocked) {
                visited.add(key);
                const newDist = dist + 1;
                distMap[key] = newDist;
                queue.push({r: nr, c: nc, dist: newDist});
            }
        }
    }
    return distMap;
}

/* ====================== 地形效果（保持不变） ====================== */
function applyTerrainEffect(unit) {
    const terrainIndex = STATE.terrainUnits.findIndex(t => t.row === unit.row && t.col === unit.col);
    if (terrainIndex === -1) return;
    const terrain = STATE.terrainUnits[terrainIndex];
    const tConfig = terrain;

    // 特殊处理一次性地形逻辑 (回复点)
    if (tConfig.effect) {
        if (tConfig.effect === "mana") {
            unit.currentMana = Math.min(unit.maxMana, unit.currentMana + tConfig.value);
            addLog(`踩到 ${tConfig.emoji} 回蓝点，恢复 <span class="font-mono">${tConfig.value}</span> 蓝量`, "cyan");
        } else if (tConfig.effect === "heal") {
            unit.hp = Math.min(unit.maxHp, unit.hp + tConfig.value);
            addLog(`踩到 ${tConfig.emoji} 回血点，恢复 <span class="font-mono">${tConfig.value}</span> 生命`, "emerald");
        }
        if (tConfig.temporary) STATE.terrainUnits.splice(terrainIndex, 1);
    }

    // 新增：支持地形自带效果 (仅限触发型)
    if (terrain.effectId && terrain.effectIsTrigger) {
        applyEffect(unit, terrain.effectConfig || terrain.effectId, terrain.effectDuration || 3);
    }
    if (terrain.temporary) STATE.terrainUnits.splice(terrainIndex, 1);
}

/* ====================== 操作逻辑（保持不变） ====================== */
function attemptPlayerMove(unit, targetRow, targetCol) {
    if (EFFECT_HANDLERS.isDisabled(unit, "move")) {
        addLog(`${unit.emoji} ${unit.name} 被禁锢，无法移动！`, "slate");
        return false;
    }

    const effectiveMove = getEffectiveMoveRange(unit);
    if (effectiveMove <= 0) return false;

    const reachable = calculateReachable(unit.row, unit.col, effectiveMove, unit);
    const key = `${targetRow},${targetCol}`;
    const dist = reachable[key];
    if (dist === undefined || dist <= 0) return false;

    const fromRow = unit.row, fromCol = unit.col;
    unit.row = targetRow;
    unit.col = targetCol;
    unit.remainingMove -= dist;
    addLog(`移动 <span class="font-mono">${dist}</span> 格（剩余 <span class="font-mono">${unit.remainingMove}</span>）`, "emerald");
    AnimationManager.animateMove(fromRow, fromCol, targetRow, targetCol, unit.emoji);
    applyTerrainEffect(unit);
    return true;
}

function performAttack(attacker, defender) {
    if (EFFECT_HANDLERS.isDisabled(attacker, "attack")) {
        addLog(`${attacker.emoji} ${attacker.name} 被控制，无法攻击！`, "slate");
        return;
    }

    if (!isInRange(attacker, defender.row, defender.col, getEffectiveAtkRange(attacker))) {
        addLog(`目标不在攻击范围内或受到地形保护`, "slate");
        return;
    }

    const range = Math.abs(attacker.row - defender.row) + Math.abs(attacker.col - defender.col);
    let damage = Math.max(1, getEffectiveAtk(attacker) - getEffectiveDef(defender));
    defender.hp = Math.max(0, defender.hp - damage);

    const attackerColor = (attacker.team === "friendly") ? "emerald" : "rose";
    addLog(`<span class="text-${attackerColor}-400">${attacker.emoji}</span> 对 <span class="text-rose-400">${defender.emoji}</span> 造成 <span class="font-bold text-rose-400">${damage}</span> 伤害`, attackerColor);

    // 触发事件
    EFFECT_HANDLERS.trigger(attacker, "onAttack", { target: defender, damageDealt: damage, range });
    EFFECT_HANDLERS.trigger(defender, "onDefend", { attacker: attacker, damageReceived: damage, range });

    AnimationManager.showDamagePopup(damage, defender.row, defender.col);
    if (attacker.atkRange === 1) {
        AnimationManager.animateMeleeBump(attacker.row, attacker.col, defender.row, defender.col, attacker.emoji);
    } else {
        AnimationManager.animateProjectile(attacker.row, attacker.col, defender.row, defender.col, "🏹");
    }
}

function performSkill(attacker, skillId, defender) {
    const skill = GAME_CONFIG.SKILLS[skillId];
    if (!isInRange(attacker, defender.row, defender.col, skill.range)) {
        addLog(`技能目标不在射程内或受到地形保护`, "slate");
        return;
    }
    const range = Math.abs(attacker.row - defender.row) + Math.abs(attacker.col - defender.col);
    let damage = Math.max(0, skill.damage - getEffectiveDef(defender));

    // 如果技能本身有伤害
    if (skill.damage > 0) {
        defender.hp = Math.max(0, defender.hp - damage);
        addLog(`<span class="text-cyan-400">${skill.emoji}</span> <span class="font-bold">${skill.name}</span> 对 <span class="text-rose-400">${defender.emoji}</span> 造成 <span class="font-bold text-rose-400">${damage}</span> 伤害`, "cyan");
        AnimationManager.showDamagePopup(damage, defender.row, defender.col);

        // 触发攻击/防御事件
        EFFECT_HANDLERS.trigger(attacker, "onAttack", { target: defender, damageDealt: damage, range, isSkill: true });
        EFFECT_HANDLERS.trigger(defender, "onDefend", { attacker: attacker, damageReceived: damage, range, isSkill: true });
    } else {
        addLog(`<span class="text-cyan-400">${skill.emoji}</span> <span class="font-bold">${skill.name}</span> 已发动`, "cyan");
    }

    // 施加状态 (对目标)
    const targetEffects = skill.targetEffects || (skill.effectId ? [{id: skill.effectId, duration: skill.effectDuration}] : []);
    targetEffects.forEach(eff => applyEffect(defender, eff, eff.duration));

    // 施加状态 (对自己)
    const selfEffects = skill.selfEffects || [];
    selfEffects.forEach(eff => applyEffect(attacker, eff, eff.duration));

    AnimationManager.animateProjectile(attacker.row, attacker.col, defender.row, defender.col, skill.emoji);
    AnimationManager.showSkillNamePopup(skill.name, defender.row, defender.col);
}

function activateSkill(skillId) {
    if (STATE.currentTurn !== "player" || !STATE.selected || STATE.selected.team !== "friendly") return;
    const unit = getUnit("friendly", STATE.selected.id);
    const skill = GAME_CONFIG.SKILLS[skillId];

    if (EFFECT_HANDLERS.isDisabled(unit, "skill")) {
        addLog(`${unit.emoji} ${unit.name} 被沉默，无法使用技能！`, "slate");
        return;
    }
    if (!skill || unit.currentMana < skill.manaCost || unit.hasAttacked) return;

    STATE.selectedSkill = skillId;
    addLog(`激活技能 <span class="text-cyan-400">${skill.emoji} ${skill.name}</span>（点击敌方目标释放）`, "cyan");
    renderBoard();
    updateSelectedPanel();
}

function selectUnit(team, id) {
    STATE.selected = { team, id };
    STATE.selectedSkill = null;
    const entity = getUnit(team, id);
    const teamText = team === "friendly" ? "友方" : (team === "enemy" ? "敌方" : "地形");
    addLog(`选中 ${teamText} <span class="text-${team === "friendly" ? "emerald" : team === "enemy" ? "rose" : "slate"}-400">${entity.emoji} ${entity.name}</span>`, team === "friendly" ? "emerald" : team === "enemy" ? "rose" : "slate");
    renderBoard();
    updateSelectedPanel();
}

function deselectUnit() {
    STATE.selected = null;
    STATE.selectedSkill = null;
    renderBoard();
    updateSelectedPanel();
}

/* ====================== 主点击处理（新增编辑模式空格子支持） ====================== */
function handleCellClick(row, col) {
    if (STATE.editMode) {
        handleEditClick(row, col);
        return;
    }

    if (STATE.currentTurn !== "player") return;

    if (STATE.selectedSkill) {
        const { combatUnit, combatTeam } = getCellContent(row, col);
        if (combatUnit) {
            const actor = getUnit("friendly", STATE.selected.id);
            const skillId = STATE.selectedSkill;
            const skill = GAME_CONFIG.SKILLS[skillId];
            if (actor && skill && isInRange(actor, row, col, skill.range)) {
                performSkill(actor, skillId, combatUnit);
                actor.currentMana -= skill.manaCost;
                actor.hasAttacked = true;
                actor.skillUsedThisTurn = true;
                STATE.selectedSkill = null;
                renderBoard();
                updateSelectedPanel();
                updateAllLists();
                checkGameOver();
                return;
            }
        }
        STATE.selectedSkill = null;
        renderBoard();
        updateSelectedPanel();
        return;
    }

    const { combatUnit, combatTeam, terrainUnit } = getCellContent(row, col);
    const sel = STATE.selected;

    if (combatUnit) {
        if (sel && sel.team === combatTeam && sel.id === combatUnit.id) { deselectUnit(); return; }
        if (sel && sel.team === "friendly" && combatTeam === "enemy") {
            const actor = getUnit("friendly", sel.id);
            if (actor && !actor.hasAttacked) {
                const effectiveAtk = actor.forestModifier ? Math.max(1, actor.atkRange - 1) : actor.atkRange;
                if (isInRange(actor, row, col, effectiveAtk)) {
                    performAttack(actor, combatUnit);
                    actor.hasAttacked = true;
                    renderBoard();
                    updateSelectedPanel();
                    updateAllLists();
                    checkGameOver();
                    return;
                }
            }
        }
        selectUnit(combatTeam, combatUnit.id);
        return;
    }

    if (sel && sel.team === "friendly") {
        const unit = getUnit("friendly", sel.id);
        if (unit && attemptPlayerMove(unit, row, col)) {
            renderBoard();
            updateSelectedPanel();
            return;
        }
    }

    if (terrainUnit) {
        if (sel && sel.team === "terrain" && sel.id === terrainUnit.id) { deselectUnit(); return; }
        selectUnit("terrain", terrainUnit.id);
        return;
    }

    deselectUnit();
}

/* ====================== 编辑模式核心（支持空格子新增/复制 + 位置移动） ====================== */
function toggleEditMode() {
    STATE.editMode = !STATE.editMode;
    const btn = document.getElementById("edit-mode-btn");
    const icon = document.getElementById("edit-icon");
    const text = document.getElementById("edit-text");

    if (STATE.editMode) {
        icon.textContent = "✕";
        text.textContent = "退出编辑模式";
        btn.classList.add("ring-2", "ring-purple-400");
        deselectUnit();
        document.getElementById("selected-panel").classList.add("hidden");
        document.getElementById("editor-panel").classList.remove("hidden");
        toggleInfoPanel(true); // 编辑模式也显示面板
        renderBoard();
        addLog("🛠️ 已进入编辑模式 • 点击任意格子（含空格）进行操作", "purple");
    } else {
        exitEditMode();
    }
}

function exitEditMode() {
    STATE.editMode = false;
    STATE.editingUnit = null;
    const btn = document.getElementById("edit-mode-btn");
    const icon = document.getElementById("edit-icon");
    const text = document.getElementById("edit-text");
    icon.textContent = "🛠️";
    text.textContent = "进入编辑模式";
    btn.classList.remove("ring-2", "ring-purple-400");
    document.getElementById("editor-panel").classList.add("hidden");
    document.getElementById("selected-panel").classList.remove("hidden");
    toggleInfoPanel(false);
    renderBoard();
    addLog("✅ 已退出编辑模式", "emerald");
    clearAnimationOverlay();
}

/**
 * 编辑模式点击处理（已彻底修复高亮残留 + 空白格多亮问题）
 */
function handleEditClick(row, col) {
    const { combatUnit, combatTeam, terrainUnit } = getCellContent(row, col);

    // 【关键修复】无论点什么，都先清空之前的选中和高亮状态
    STATE.selected = null;
    STATE.selectedSkill = null;

    if (STATE.editingUnit && STATE.editingUnit.pendingCopy) {
        // 复制模式：点击空白格才生效
        if (!combatUnit && !terrainUnit) {
            const source = getUnit(STATE.editingUnit.team, STATE.editingUnit.sourceId);
            if (source) {
                const newId = (STATE.editingUnit.team === "friendly" ? "f_copy_" : STATE.editingUnit.team === "enemy" ? "e_copy_" : "t_copy_") + Date.now();
                let newUnit = { ...source, id: newId, row, col };
                if (STATE.editingUnit.team === "friendly") STATE.friendlyUnits.push(newUnit);
                else if (STATE.editingUnit.team === "enemy") STATE.enemyUnits.push(newUnit);
                else STATE.terrainUnits.push(newUnit);

                addLog(`📋 已复制单位到 (${row},${col})`, "amber");
            }
        }
        STATE.editingUnit = null; // 复制完成后清除
    }
    else if (combatUnit || terrainUnit) {
        // 选中已有单位/地形
        const team = combatUnit ? combatTeam : "terrain";
        const id = combatUnit ? combatUnit.id : terrainUnit.id;
        const isTerrain = !!terrainUnit;
        STATE.editingUnit = { team, id, isTerrain, row, col };
    }
    else {
        // 点击空白格 → 待新增（只标记当前格子）
        STATE.editingUnit = {
            team: null,
            id: null,
            isTerrain: false,
            pendingAdd: true,
            row,
            col
        };
    }

    renderBoard();   // 触发高亮刷新
    renderEditForm();
}

/**
 * 编辑器导航系统
 */
function pushEditorState(renderFn, ...args) {
    STATE.editorHistory.push({ renderFn, args });
    renderFn(...args);
}

function popEditorState() {
    if (STATE.editorHistory.length <= 1) {
        STATE.editorHistory = [];
        renderEditForm();
        return;
    }
    STATE.editorHistory.pop(); // 弹出当前的
    const last = STATE.editorHistory[STATE.editorHistory.length - 1];
    last.renderFn(...last.args);
}

function clearEditorHistory() {
    STATE.editorHistory = [];
}

/**
 * 编辑器表单渲染（已优化：技能输入框增加标签 + 地形改为预设选择 + 空白格高亮）
 */
function renderEditForm(isBack = false) {
    if (!isBack) {
        clearEditorHistory();
        STATE.editorHistory.push({ renderFn: renderEditForm, args: [true] });
    }
    const container = document.getElementById("edit-unit-form");
    if (!STATE.editingUnit) {
        container.innerHTML = `<div class="text-center text-slate-400 py-12">点击棋盘上的任意格子开始编辑</div>`;
        return;
    }

    const isPendingAdd = STATE.editingUnit.pendingAdd;
    const unit = STATE.editingUnit.id ? getUnit(STATE.editingUnit.team, STATE.editingUnit.id) : null;
    const isTerrain = STATE.editingUnit.isTerrain;

    let html = `<div class="space-y-6">`;

    // 空白格新增模式（含复制后的待放置）
    if (isPendingAdd) {
        html += `
            <div class="text-center py-8">
                <div class="text-emerald-400 text-lg font-bold mb-6">在此格子（${STATE.editingUnit.row},${STATE.editingUnit.col}）新增单位</div>
                <div class="flex flex-col gap-3">
                    <button onclick="createNewUnitHere('friendly')" class="py-4 bg-emerald-600 hover:bg-emerald-500 rounded-3xl text-white font-bold">新增友方单位</button>
                    <button onclick="createNewUnitHere('enemy')" class="py-4 bg-rose-600 hover:bg-rose-500 rounded-3xl text-white font-bold">新增敌方单位</button>
                    <button onclick="createNewUnitHere('terrain')" class="py-4 bg-slate-600 hover:bg-slate-500 rounded-3xl text-white font-bold">新增地形</button>
                </div>
            </div>`;
    }
    // 已选中单位/地形
    else if (unit) {
        html += `<div class="space-y-6">`;

        // 基本属性（通用）
        html += `
            <div>
                <div class="text-xs uppercase text-purple-300 mb-2 font-bold tracking-widest opacity-60">基本属性</div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] uppercase font-bold text-slate-500 mb-1">图标 (Emoji)</label>
                        <div class="flex flex-wrap gap-1 mb-2">
                            <button onclick="quickSetEmoji('⚔️')" class="text-xl p-2 bg-slate-800 hover:bg-slate-700 rounded-lg">⚔️</button>
                            <button onclick="quickSetEmoji('🏹')" class="text-xl p-2 bg-slate-800 hover:bg-slate-700 rounded-lg">🏹</button>
                            <button onclick="quickSetEmoji('🛡️')" class="text-xl p-2 bg-slate-800 hover:bg-slate-700 rounded-lg">🛡️</button>
                            <button onclick="quickSetEmoji('🔥')" class="text-xl p-2 bg-slate-800 hover:bg-slate-700 rounded-lg">🔥</button>
                            <button onclick="quickSetEmoji('⛰️')" class="text-xl p-2 bg-slate-800 hover:bg-slate-700 rounded-lg">⛰️</button>
                            <button onclick="quickSetEmoji('🌊')" class="text-xl p-2 bg-slate-800 hover:bg-slate-700 rounded-lg">🌊</button>
                            <button onclick="quickSetEmoji('🌲')" class="text-xl p-2 bg-slate-800 hover:bg-slate-700 rounded-lg">🌲</button>
                            <button onclick="quickSetEmoji('🔵')" class="text-xl p-2 bg-slate-800 hover:bg-slate-700 rounded-lg">🔵</button>
                            <button onclick="quickSetEmoji('❤️')" class="text-xl p-2 bg-slate-800 hover:bg-slate-700 rounded-lg">❤️</button>
                        </div>
                        <input id="edit-emoji" type="text" value="${unit.emoji}" class="editor-input w-full px-4 py-3 rounded-xl text-3xl text-center" maxlength="2">
                    </div>
                    <div>
                        <label class="block text-[10px] uppercase font-bold text-slate-500 mb-1">名称</label>
                        <input id="edit-name" type="text" value="${unit.name}" class="editor-input w-full px-4 py-3 rounded-xl">
                    </div>
                </div>
            </div>`;

        if (!isTerrain) {
            html += `
                <div class="grid grid-cols-3 gap-4">
                    <div><label class="block text-[10px] font-bold text-slate-500 mb-1">攻击 ATK</label><input id="edit-atk" type="number" value="${unit.atk}" class="editor-input w-full px-4 py-3 rounded-xl text-center font-mono"></div>
                    <div><label class="block text-[10px] font-bold text-slate-500 mb-1">防御 DEF</label><input id="edit-def" type="number" value="${unit.def}" class="editor-input w-full px-4 py-3 rounded-xl text-center font-mono"></div>
                    <div><label class="block text-[10px] font-bold text-slate-500 mb-1">蓝量 MANA</label><input id="edit-mana" type="number" value="${unit.mana}" class="editor-input w-full px-4 py-3 rounded-xl text-center font-mono"></div>
                </div>
                <div class="grid grid-cols-3 gap-4">
                    <div><label class="block text-[10px] font-bold text-slate-500 mb-1">移动范围</label><input id="edit-move" type="number" value="${unit.moveRange}" class="editor-input w-full px-4 py-3 rounded-xl text-center font-mono"></div>
                    <div><label class="block text-[10px] font-bold text-slate-500 mb-1">攻击范围</label><input id="edit-atkRange" type="number" value="${unit.atkRange}" class="editor-input w-full px-4 py-3 rounded-xl text-center font-mono"></div>
                    <div><label class="block text-[10px] font-bold text-slate-500 mb-1">生命值 HP</label><input id="edit-hp" type="number" value="${unit.hp}" class="editor-input w-full px-4 py-3 rounded-xl text-center font-mono"></div>
                </div>

                <div>
                    <div class="text-xs uppercase text-purple-300 mb-3 flex justify-between font-bold tracking-widest opacity-60">
                        <span>技能管理</span>
                        <button onclick="pushEditorState(showAddSkillForm)" class="text-[10px] px-3 py-1 bg-purple-600/40 hover:bg-purple-600/60 rounded-lg border border-purple-500/30">+ 新增技能</button>
                    </div>
                    <div id="edit-normal-skills" class="space-y-2"></div>
                    <div class="mt-4">
                        <label class="block text-[10px] font-bold text-slate-500 mb-1 tracking-widest uppercase">终极技能</label>
                        <select id="edit-ult-skill" class="editor-input w-full px-4 py-3 rounded-xl">
                            ${Object.keys(GAME_CONFIG.SKILLS).map(k => `<option value="${k}" ${unit.ultSkill === k ? 'selected' : ''}>${GAME_CONFIG.SKILLS[k].name}</option>`).join('')}
                        </select>
                    </div>
                </div>`;
        } else {
            html += `
                <div>
                    <div class="text-xs uppercase text-purple-300 mb-3 font-bold tracking-widest opacity-60">地形预设</div>
                    <div class="grid grid-cols-2 gap-3" id="terrain-preset-list"></div>
                </div>`;
        }

        // 保存/删除/复制按钮
        html += `
            <div class="flex flex-col gap-3 pt-6 border-t border-white/10">
                <button onclick="saveCurrentEdit()" class="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-xl transition-all active:scale-[0.98]">💾 保存全部修改</button>
                <div class="flex gap-3">
                    <button onclick="deleteCurrentUnit()" class="flex-1 py-3 bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 border border-rose-500/30 font-bold rounded-2xl transition-all">🗑️ 删除</button>
                    <button onclick="copySelectedUnit()" class="flex-1 py-3 bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 border border-amber-500/30 font-bold rounded-2xl transition-all">📋 复制</button>
                </div>
            </div>`;
    }

    html += `</div>`;
    container.innerHTML = html;

    // 【新增】地形预设渲染
    if (isTerrain && unit) {
        renderTerrainPresetList(unit);
    }
    // 战斗单位技能列表保持原来逻辑
    if (!isTerrain && !isPendingAdd && unit) renderCurrentNormalSkills();

    // 【新增】状态绑定显示
    if (!isPendingAdd && unit) renderEffectBindingList(unit);

    // 【新增】全局状态编辑器入口
    if (!isPendingAdd) renderGlobalEffectEditorLink();
}

/**
 * 渲染全局状态编辑器链接
 */
function renderGlobalEffectEditorLink() {
    const container = document.createElement("div");
    container.className = "mt-12 pt-6 border-t-2 border-dashed border-purple-500/20";
    container.innerHTML = `
        <button onclick="pushEditorState(showGlobalEffectEditor)" class="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2">
            <span>✨</span> 状态库管理器
        </button>
        <p class="text-[9px] text-slate-500 text-center mt-3 uppercase tracking-widest">在这里定义新的全局状态组件</p>
    `;
    document.getElementById("edit-unit-form").appendChild(container);
}

function showGlobalEffectEditor() {
    const container = document.getElementById("edit-unit-form");
    const html = `
        <div class="bg-slate-900 border border-purple-500/30 rounded-[32px] p-6 space-y-6 shadow-2xl">
            <div class="flex justify-between items-center">
                <div class="text-purple-400 font-black text-xl uppercase">状态库管理器</div>
                <button onclick="popEditorState()" class="text-slate-500 hover:text-white">✕</button>
            </div>

            <div class="space-y-3 max-h-64 overflow-y-auto custom-scroll pr-2">
                ${Object.keys(EFFECT_LIBRARY).map(id => {
                    const t = EFFECT_LIBRARY[id];
                    return `
                    <div class="flex items-center gap-3 bg-slate-800/40 p-3 rounded-2xl border border-white/5">
                        <span class="text-2xl">${t.emoji}</span>
                        <div class="flex-1 min-w-0">
                            <div class="font-bold text-xs">${t.name}</div>
                            <div class="text-[9px] text-slate-500 truncate">${t.desc}</div>
                        </div>
                        <button onclick="deleteGlobalEffect('${id}')" class="p-2 text-rose-500/50 hover:text-rose-400 transition-colors text-xs">删除</button>
                    </div>`;
                }).join("")}
            </div>

            <button onclick="pushEditorState(showCreateEffectForm)" class="w-full py-4 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 text-purple-300 font-bold rounded-2xl transition-all">
                + 定义新状态
            </button>

            <button onclick="popEditorState()" class="w-full py-3 bg-slate-800 text-slate-400 rounded-xl text-xs font-bold">返回</button>
        </div>
    `;
    container.innerHTML = html;
}

function deleteGlobalEffect(id) {
    if (confirm(`确定要从库中删除状态「${EFFECT_LIBRARY[id].name}」吗？已经绑定的单位可能会失效。`)) {
        delete EFFECT_LIBRARY[id];
        showGlobalEffectEditor();
    }
}

function showCreateEffectForm(options = {}) {
    const {
        fromBinding = false,
        isInstance = false,
        baseEffect = null,
        onConfirm = null
    } = options;

    const container = document.getElementById("edit-unit-form");
    const config = baseEffect ? EFFECT_HANDLERS.getConfig(baseEffect) : { components: {} };

    container.innerHTML = `
        <div class="bg-slate-900 border border-emerald-500/30 rounded-[32px] p-6 space-y-6 shadow-2xl">
            <div class="text-emerald-400 font-black text-xl uppercase">${isInstance ? '编辑当前状态实例' : (fromBinding ? '创建并绑定状态' : '定义新状态')}</div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-[10px] font-bold text-slate-500 mb-1">图标 (Emoji)</label>
                    <input id="new-eff-emoji" value="${config.emoji || '✨'}" class="editor-input w-full px-4 py-2 rounded-xl text-center text-xl">
                </div>
                <div>
                    <label class="block text-[10px] font-bold text-slate-500 mb-1">状态名称</label>
                    <input id="new-eff-name" value="${config.name || ''}" class="editor-input w-full px-4 py-2 rounded-xl">
                </div>
            </div>

            <div class="${isInstance ? 'hidden' : ''}">
                <label class="block text-[10px] font-bold text-slate-500 mb-1">状态 ID (唯一英文字符)</label>
                <input id="new-eff-id" value="${config.id || ''}" placeholder="atk_buff_2" class="editor-input w-full px-4 py-2 rounded-xl font-mono text-xs">
            </div>

            <div>
                <label class="block text-[10px] font-bold text-slate-500 mb-1">描述</label>
                <input id="new-eff-desc" value="${config.desc || ''}" class="editor-input w-full px-4 py-2 rounded-xl text-xs">
            </div>

            <div class="space-y-4">
                <div class="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest">配置组件</div>

                <!-- 属性组件 -->
                <div class="p-4 bg-slate-800/40 rounded-2xl border border-white/5 space-y-3">
                    <div class="text-[10px] font-bold text-slate-400">属性修正 (数值叠加)</div>
                    <div class="grid grid-cols-2 gap-2">
                        <input id="comp-stat-atk" type="number" value="${config.components.stats?.atk || ''}" placeholder="ATK +" class="editor-input px-3 py-2 rounded-lg text-xs">
                        <input id="comp-stat-def" type="number" value="${config.components.stats?.def || ''}" placeholder="DEF +" class="editor-input px-3 py-2 rounded-lg text-xs">
                        <input id="comp-stat-move" type="number" value="${config.components.stats?.move || ''}" placeholder="MOVE +" class="editor-input px-3 py-2 rounded-lg text-xs">
                        <input id="comp-stat-range" type="number" value="${config.components.stats?.range || ''}" placeholder="RANGE +" class="editor-input px-3 py-2 rounded-lg text-xs">
                    </div>
                </div>

                <!-- 持续组件 -->
                <div class="p-4 bg-slate-800/40 rounded-2xl border border-white/5 space-y-3">
                    <div class="text-[10px] font-bold text-slate-400">周期触发</div>
                    <div class="grid grid-cols-2 gap-2">
                        <input id="comp-tick-dmg" type="number" value="${config.components.tick?.damage || ''}" placeholder="每回合伤害" class="editor-input px-3 py-2 rounded-lg text-xs">
                        <input id="comp-tick-heal" type="number" value="${config.components.tick?.heal || ''}" placeholder="每回合治疗" class="editor-input px-3 py-2 rounded-lg text-xs">
                    </div>
                </div>

                <!-- 行为限制 -->
                <div class="p-4 bg-slate-800/40 rounded-2xl border border-white/5 space-y-3">
                    <div class="text-[10px] font-bold text-slate-400">行为限制</div>
                    <div class="flex flex-wrap gap-4">
                        <label class="flex items-center gap-2 text-[10px] text-slate-300">
                            <input id="comp-inhibit-move" type="checkbox" ${config.components.inhibit?.move ? 'checked' : ''} class="accent-rose-500"> 禁止移动
                        </label>
                        <label class="flex items-center gap-2 text-[10px] text-slate-300">
                            <input id="comp-inhibit-attack" type="checkbox" ${config.components.inhibit?.attack ? 'checked' : ''} class="accent-rose-500"> 禁止攻击
                        </label>
                        <label class="flex items-center gap-2 text-[10px] text-slate-300">
                            <input id="comp-inhibit-skill" type="checkbox" ${config.components.inhibit?.skill ? 'checked' : ''} class="accent-rose-500"> 禁止技能
                        </label>
                    </div>
                </div>

                <!-- 保护组件 -->
                <div class="p-4 bg-slate-800/40 rounded-2xl border border-white/5 space-y-3">
                    <div class="text-[10px] font-bold text-slate-400">特殊保护 (地形组件)</div>
                    <div class="grid grid-cols-1 gap-2">
                        <input id="comp-protect-range" type="number" value="${config.components.protect?.limitRange || ''}" placeholder="限制攻击者距离 (例如森林为1)" class="editor-input px-3 py-2 rounded-lg text-xs">
                    </div>
                </div>

                <!-- 光环组件 -->
                <div class="p-4 bg-slate-800/40 rounded-2xl border border-white/5 space-y-3">
                    <div class="text-[10px] font-bold text-slate-400">光环配置 (影响周围单位)</div>
                    <div class="grid grid-cols-2 gap-2">
                        <input id="comp-aura-range" type="number" value="${config.components.aura?.range || ''}" placeholder="范围 (格)" class="editor-input px-3 py-2 rounded-lg text-xs">
                        <select id="comp-aura-target" class="editor-input px-3 py-2 rounded-lg text-xs">
                            <option value="ally" ${config.components.aura?.target === 'ally' ? 'selected' : ''}>仅友军</option>
                            <option value="enemy" ${config.components.aura?.target === 'enemy' ? 'selected' : ''}>仅敌军</option>
                            <option value="all" ${config.components.aura?.target === 'all' ? 'selected' : ''}>所有人</option>
                        </select>
                    </div>
                    <div class="text-[9px] text-slate-500 italic">光环生效时会应用上述属性修正/行为限制</div>
                </div>

                <!-- 时长 -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] font-bold text-slate-500 mb-1">默认持续时间</label>
                        <input id="new-eff-dur" type="number" value="3" class="editor-input w-full px-4 py-2 rounded-xl text-center">
                    </div>
                    <div class="flex items-center gap-2 pt-4">
                        <input id="new-eff-stack" type="checkbox" checked class="w-5 h-5 accent-emerald-500">
                        <label class="text-xs font-bold text-slate-300">支持数值叠加</label>
                    </div>
                </div>
            </div>

            <div class="flex gap-2">
                <button onclick="confirmCreateEffect(${fromBinding})" class="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all">确认</button>
                <button onclick="popEditorState()" class="flex-1 py-4 bg-slate-800 text-slate-400 font-bold rounded-2xl transition-all">取消</button>
            </div>
        </div>
    `;
}

function confirmCreateEffect(returnToBinding = false) {
    const id = document.getElementById("new-eff-id").value || ("eff_" + Date.now());
    const name = document.getElementById("new-eff-name").value || "新状态";
    const emoji = document.getElementById("new-eff-emoji").value || "✨";
    const desc = document.getElementById("new-eff-desc").value || "";
    const duration = parseInt(document.getElementById("new-eff-dur").value) || 3;
    const stackable = document.getElementById("new-eff-stack").checked;

    const components = {};

    // 收集属性
    const stats = {};
    const sAtk = parseInt(document.getElementById("comp-stat-atk").value);
    const sDef = parseInt(document.getElementById("comp-stat-def").value);
    const sMove = parseInt(document.getElementById("comp-stat-move").value);
    const sRange = parseInt(document.getElementById("comp-stat-range").value);
    if (sAtk) stats.atk = sAtk;
    if (sDef) stats.def = sDef;
    if (sMove) stats.move = sMove;
    if (sRange) stats.range = sRange;
    if (Object.keys(stats).length > 0) components.stats = stats;

    // 收集 Tick
    const tick = {};
    const tDmg = parseInt(document.getElementById("comp-tick-dmg").value);
    const tHeal = parseInt(document.getElementById("comp-tick-heal").value);
    if (tDmg) tick.damage = tDmg;
    if (tHeal) tick.heal = tHeal;
    if (Object.keys(tick).length > 0) components.tick = tick;

    // 收集 Inhibit
    const inhibit = {};
    if (document.getElementById("comp-inhibit-move").checked) inhibit.move = true;
    if (document.getElementById("comp-inhibit-attack").checked) inhibit.attack = true;
    if (document.getElementById("comp-inhibit-skill").checked) inhibit.skill = true;
    if (Object.keys(inhibit).length > 0) components.inhibit = inhibit;

    // 收集 Protect
    const pRange = parseInt(document.getElementById("comp-protect-range").value);
    if (pRange) components.protect = { limitRange: pRange };

    // 收集 Aura
    const auraRange = parseInt(document.getElementById("comp-aura-range").value);
    if (auraRange) {
        components.aura = {
            range: auraRange,
            target: document.getElementById("comp-aura-target").value,
            stats: stats, // 光环通常携带属性变化
            inhibit: inhibit
        };
    }

    const newEffect = { id, name, emoji, color: "emerald", desc, duration, stackable, components };

    // 如果是编辑实例，调用回调并返回；否则存入库
    if (STATE.tempOnConfirm) {
        STATE.tempOnConfirm(newEffect);
        STATE.tempOnConfirm = null;
    } else {
        EFFECT_LIBRARY[id] = newEffect;
        addLog(`✅ 已创建全局状态并存入库：${emoji} ${name}`, "emerald");
    }

    popEditorState();
}

/**
 * 渲染状态绑定列表
 */
function renderEffectBindingList(unit) {
    const isTerrain = STATE.editingUnit.isTerrain;
    const container = document.createElement("div");
    container.className = "mt-6 pt-6 border-t border-white/10";
    container.innerHTML = `
        <div class="text-xs uppercase text-purple-300 mb-3 flex justify-between font-bold tracking-widest opacity-60">
            <span>附加状态管理</span>
            <button onclick="pushEditorState(showAddEffectToUnitForm)" class="text-[10px] px-3 py-1 bg-indigo-600/40 hover:bg-indigo-600/60 rounded-lg border border-indigo-500/30">+ 绑定状态</button>
        </div>
        <div id="unit-bound-effects" class="space-y-2"></div>
    `;

    document.getElementById("edit-unit-form").appendChild(container);
    const list = document.getElementById("unit-bound-effects");

    // 地形使用 effectId, 战斗单位使用 activeEffects
    const boundEffects = isTerrain ? (unit.effectId ? [{id: unit.effectId, duration: unit.effectDuration}] : []) : (unit.activeEffects || []);

    list.innerHTML = boundEffects.map((eff, idx) => {
        const t = EFFECT_LIBRARY[eff.id || eff];
        if (!t) return "";
        return `
            <div class="flex items-center gap-3 bg-slate-800/60 p-3 rounded-xl border border-white/5">
                <span class="text-2xl">${t.emoji}</span>
                <div class="flex-1 min-w-0">
                    <div class="font-bold text-xs truncate">${t.name}</div>
                    <div class="text-[9px] text-slate-500">${t.desc}</div>
                </div>
                <div class="flex gap-1">
                    <button onclick="editBoundEffect(${idx})" class="p-2 text-amber-400 hover:bg-amber-400/20 rounded-lg transition-colors">✏️</button>
                    <button onclick="removeEffectFromUnit(${idx})" class="p-2 text-rose-400 hover:bg-rose-400/20 rounded-lg transition-colors">🗑️</button>
                </div>
            </div>
        `;
    }).join("");
}

function showAddEffectToUnitForm() {
    STATE.editingSkillId = null;
    const container = document.getElementById("edit-unit-form");
    const html = `
        <div class="bg-slate-900 border border-indigo-500/30 rounded-[32px] p-6 space-y-6 shadow-2xl">
            <div class="flex justify-between items-center mb-4">
                <div class="text-indigo-400 text-xs font-bold uppercase tracking-widest">选择要绑定的状态</div>
                <button onclick="pushEditorState(showCreateEffectForm, true)" class="text-[9px] px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg">新建状态库条目</button>
            </div>
            <div class="grid grid-cols-2 gap-2 mb-4 max-h-48 overflow-y-auto custom-scroll">
                ${Object.keys(EFFECT_LIBRARY).map(id => `
                    <button onclick="confirmBindEffect('${id}')" class="flex items-center gap-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-left transition-all">
                        <span>${EFFECT_LIBRARY[id].emoji}</span>
                        <span class="text-[10px] font-bold truncate">${EFFECT_LIBRARY[id].name}</span>
                    </button>
                `).join("")}
            </div>
            <button onclick="popEditorState()" class="w-full py-3 bg-slate-800 text-slate-400 rounded-xl text-xs font-bold">取消</button>
        </div>
    `;
    container.innerHTML = html;
}

function confirmBindEffect(effectId) {
    const unit = getUnit(STATE.editingUnit.team, STATE.editingUnit.id);
    if (STATE.editingUnit.isTerrain) {
        const isTrigger = confirm("是否将其设为「触发型」效果？\n确定：单位踩上去后获得该状态（离开后仍持续数回合）\n取消：单位站在此处时生效（离开后立刻消失）");
        unit.effectId = effectId;
        unit.effectIsTrigger = isTrigger;
        unit.effectDuration = EFFECT_LIBRARY[effectId].duration || 3;
    } else {
        if (!unit.activeEffects) unit.activeEffects = [];
        // 如果已经有了，不重复添加
        if (!unit.activeEffects.some(e => e.id === effectId)) {
            unit.activeEffects.push({ id: effectId, stacks: 1, remainingTurns: EFFECT_LIBRARY[effectId].duration });
        }
    }
    addLog(`✅ 已为单位绑定状态：${EFFECT_LIBRARY[effectId].name}`, "indigo");
    popEditorState();
}

function editBoundEffect(index) {
    const unit = getUnit(STATE.editingUnit.team, STATE.editingUnit.id);
    const effects = STATE.editingUnit.isTerrain
        ? (unit.effectConfig ? [unit.effectConfig] : [{ id: unit.effectId }])
        : unit.activeEffects;

    const targetEffect = effects[index];

    STATE.tempOnConfirm = (newConfig) => {
        if (STATE.editingUnit.isTerrain) {
            unit.effectConfig = newConfig;
            unit.effectId = newConfig.id;
        } else {
            unit.activeEffects[index] = { ...unit.activeEffects[index], ...newConfig };
        }
        addLog(`✅ 已更新状态实例数值`, "amber");
    };

    pushEditorState(showCreateEffectForm, {
        isInstance: true,
        baseEffect: targetEffect
    });
}

function removeEffectFromUnit(index) {
    const unit = getUnit(STATE.editingUnit.team, STATE.editingUnit.id);
    if (STATE.editingUnit.isTerrain) {
        unit.effectId = null;
    } else {
        unit.activeEffects.splice(index, 1);
    }
    renderEditForm();
}

/**
 * 应用选中的地形预设（切换地形类型）
 */
function applyTerrainPreset(newType) {
    if (!STATE.editingUnit || !STATE.editingUnit.id) return;
    const unit = getUnit(STATE.editingUnit.team, STATE.editingUnit.id);
    if (!unit) return;

    const template = GAME_CONFIG.UNIT_TYPES[newType];
    Object.assign(unit, template); // 直接应用完整模板
    unit.type = newType;
    unit.id = STATE.editingUnit.id; // 保留原有ID

    addLog(`✅ 地形已切换为 <span class="text-amber-300">${template.emoji} ${template.name}</span>`, "amber");
    renderEditForm();   // 刷新表单
    renderBoard();
}

/**
 * 渲染地形预设选择列表（替换原来的自定义地形字段）
 */
function renderTerrainPresetList(currentUnit) {
    const container = document.getElementById("terrain-preset-list");
    if (!container) return;

    const presets = getTerrainPresets();
    container.innerHTML = presets.map(p => {
        const isActive = p.type === currentUnit.type;
        return `
            <button onclick="applyTerrainPreset('${p.type}')"
                    class="p-3 rounded-2xl border flex flex-col items-center text-center transition-all ${isActive ? 'border-purple-400 bg-purple-900/30' : 'border-white/5 bg-slate-800/40 hover:border-white/20'}">
                <span class="text-3xl mb-1">${p.emoji}</span>
                <div class="font-bold text-xs">${p.name}</div>
            </button>`;
    }).join('');
}

function quickSetEmoji(emoji) {
    const input = document.getElementById("edit-emoji");
    if (input) input.value = emoji;
}

function renderCurrentNormalSkills() {
    const container = document.getElementById("edit-normal-skills");
    if (!container) return;
    const unit = getUnit(STATE.editingUnit.team, STATE.editingUnit.id);
    const currentSkills = unit.normalSkills || [];

    container.innerHTML = currentSkills.map(skillId => {
        const skill = GAME_CONFIG.SKILLS[skillId];
        if (!skill) return '';
        return `
            <div class="flex items-center gap-3 bg-slate-800/60 p-3 rounded-xl border border-white/5">
                <span class="text-2xl">${skill.emoji}</span>
                <div class="flex-1 min-w-0">
                    <div class="font-bold text-xs truncate">${skill.name}</div>
                    <div class="text-[9px] text-slate-500">${skill.manaCost} MP / ${skill.damage} DMG</div>
                </div>
                <div class="flex gap-1">
                    <button onclick="event.stopImmediatePropagation(); previewSkillInEdit('${skillId}');" class="p-2 text-cyan-400 hover:bg-cyan-400/20 rounded-lg transition-colors">👁️</button>
                    <button onclick="event.stopImmediatePropagation(); pushEditorState(editExistingSkill, '${skillId}');" class="p-2 text-amber-400 hover:bg-amber-400/20 rounded-lg transition-colors">✏️</button>
                    <button onclick="event.stopImmediatePropagation(); deleteSkill('${skillId}');" class="p-2 text-rose-400 hover:bg-rose-400/20 rounded-lg transition-colors">🗑️</button>
                </div>
            </div>`;
    }).join('');
}

function previewSkillInEdit(skillId) {
    const unit = getUnit(STATE.editingUnit.team, STATE.editingUnit.id);
    highlightSkillRange(unit, skillId);
    if (STATE.previewTimeout) clearTimeout(STATE.previewTimeout);
    STATE.previewTimeout = setTimeout(() => renderBoard(), 2200);
    addLog(`预览技能范围：${GAME_CONFIG.SKILLS[skillId].emoji} ${GAME_CONFIG.SKILLS[skillId].name}`, "cyan");
}

function deleteSkill(skillId) {
    const unit = getUnit(STATE.editingUnit.team, STATE.editingUnit.id);
    unit.normalSkills = unit.normalSkills.filter(s => s !== skillId);
    renderEditForm();
}

function editExistingSkill(skillId) {
    const skill = GAME_CONFIG.SKILLS[skillId];
    if (!skill) return;
    const container = document.getElementById("edit-unit-form");
    const html = `
        <div class="bg-slate-900 border border-amber-500/30 rounded-[32px] p-6 space-y-6 shadow-2xl">
            <div class="text-amber-400 text-xs font-bold mb-4 uppercase tracking-widest">编辑技能</div>
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div><label class="block text-[10px] font-bold text-slate-500 mb-1">图标</label><input id="new-skill-emoji" value="${skill.emoji}" class="editor-input w-full px-4 py-2 rounded-xl text-center text-xl"></div>
                    <div><label class="block text-[10px] font-bold text-slate-500 mb-1">名称</label><input id="new-skill-name" value="${skill.name}" class="editor-input w-full px-4 py-2 rounded-xl"></div>
                </div>
                <div class="grid grid-cols-3 gap-3">
                    <div><label class="block text-[10px] font-bold text-slate-500 mb-1">蓝耗</label><input id="new-skill-cost" type="number" value="${skill.manaCost}" class="editor-input w-full px-4 py-2 rounded-xl text-center font-mono"></div>
                    <div><label class="block text-[10px] font-bold text-slate-500 mb-1">范围</label><input id="new-skill-range" type="number" value="${skill.range}" class="editor-input w-full px-4 py-2 rounded-xl text-center font-mono"></div>
                    <div><label class="block text-[10px] font-bold text-slate-500 mb-1">伤害</label><input id="new-skill-dmg" type="number" value="${skill.damage}" class="editor-input w-full px-4 py-2 rounded-xl text-center font-mono"></div>
                </div>
                <div><label class="block text-[10px] font-bold text-slate-500 mb-1">技能描述</label><input id="new-skill-desc" value="${skill.desc}" class="editor-input w-full px-4 py-2 rounded-xl"></div>
                <div class="flex gap-2">
                    <button onclick="confirmEditSkill('${skillId}')" class="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all">保存</button>
                    <button onclick="popEditorState()" class="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all">取消</button>
                </div>
            </div>
            <div id="skill-effect-binding-container"></div>
        </div>`;
    container.innerHTML = html;
    renderSkillEffectBinding(skillId);
}

function renderSkillEffectBinding(skillId) {
    const skill = skillId === 'temp' ? STATE.tempNewSkill : GAME_CONFIG.SKILLS[skillId];
    const container = document.createElement("div");
    container.className = "mt-4 pt-4 border-t border-amber-500/20 space-y-4";
    container.innerHTML = `
        <div>
            <div class="text-[10px] font-bold text-rose-500/60 uppercase mb-2">对目标附加</div>
            <div id="skill-target-effects" class="space-y-1 mb-2"></div>
            <button onclick="${skillId === 'temp' ? 'syncTempSkill(); ' : ''}pushEditorState(showAddEffectToSkillForm, '${skillId}', 'target')" class="w-full py-2 bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 text-[10px] font-bold rounded-lg border border-rose-500/30 transition-all">+ 绑定给目标</button>
        </div>
        <div>
            <div class="text-[10px] font-bold text-emerald-500/60 uppercase mb-2">对自己附加</div>
            <div id="skill-self-effects" class="space-y-1 mb-2"></div>
            <button onclick="${skillId === 'temp' ? 'syncTempSkill(); ' : ''}pushEditorState(showAddEffectToSkillForm, '${skillId}', 'self')" class="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-500/30 transition-all">+ 绑定给自己</button>
        </div>
    `;
    document.getElementById("skill-effect-binding-container").appendChild(container);

    const targetList = document.getElementById("skill-target-effects");
    const tEffs = skill.targetEffects || (skill.effectId ? [{id: skill.effectId, duration: skill.effectDuration}] : []);
    targetList.innerHTML = tEffs.map((eff, idx) => {
        const t = EFFECT_LIBRARY[eff.id];
        const config = EFFECT_HANDLERS.getConfig(eff);
        return t ? `
            <div class="flex items-center justify-between bg-black/20 p-2 rounded-lg text-[10px]">
                <span>${config.emoji} ${config.name} (${config.duration}T)</span>
                <div class="flex gap-2">
                    <button onclick="${skillId === 'temp' ? 'syncTempSkill(); ' : ''}editSkillEffect('${skillId}', ${idx}, 'target')" class="text-amber-400">✏️</button>
                    <button onclick="${skillId === 'temp' ? 'syncTempSkill(); ' : ''}removeEffectFromSkill('${skillId}', ${idx}, 'target')" class="text-rose-400">✕</button>
                </div>
            </div>` : "";
    }).join("");

    const selfList = document.getElementById("skill-self-effects");
    const sEffs = skill.selfEffects || [];
    selfList.innerHTML = sEffs.map((eff, idx) => {
        const t = EFFECT_LIBRARY[eff.id];
        const config = EFFECT_HANDLERS.getConfig(eff);
        return t ? `
            <div class="flex items-center justify-between bg-black/20 p-2 rounded-lg text-[10px]">
                <span>${config.emoji} ${config.name} (${config.duration}T)</span>
                <div class="flex gap-2">
                    <button onclick="${skillId === 'temp' ? 'syncTempSkill(); ' : ''}editSkillEffect('${skillId}', ${idx}, 'self')" class="text-amber-400">✏️</button>
                    <button onclick="${skillId === 'temp' ? 'syncTempSkill(); ' : ''}removeEffectFromSkill('${skillId}', ${idx}, 'self')" class="text-rose-400">✕</button>
                </div>
            </div>` : "";
    }).join("");
}

function showAddEffectToSkillForm(skillId, type) {
    STATE.editingSkillId = skillId;
    const container = document.getElementById("edit-unit-form");
    const html = `
        <div class="bg-slate-900 border border-amber-500/30 rounded-[32px] p-6 space-y-6 shadow-2xl">
            <div class="flex justify-between items-center">
                <span class="text-amber-300 font-bold uppercase tracking-widest text-sm">选择状态</span>
                <button onclick="pushEditorState(showCreateEffectForm, true)" class="text-[10px] px-2 py-1 bg-amber-600 text-white rounded-lg">新建状态库条目</button>
            </div>
            <select id="new-skill-eff-id-${type}" class="editor-input w-full px-4 py-3 rounded-xl text-xs">
                ${Object.keys(EFFECT_LIBRARY).map(id => `<option value="${id}">${EFFECT_LIBRARY[id].emoji} ${EFFECT_LIBRARY[id].name}</option>`).join("")}
            </select>
            <input id="new-skill-eff-dur-${type}" type="number" value="3" class="editor-input w-full px-4 py-3 rounded-xl text-xs" placeholder="持续回合">
            <div class="flex gap-2">
                <button onclick="confirmBindEffectToSkill('${skillId}', '${type}')" class="flex-1 py-3 bg-amber-600 text-white text-xs font-bold rounded-xl">确定</button>
                <button onclick="popEditorState()" class="flex-1 py-3 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl">取消</button>
            </div>
        </div>
    `;
    container.innerHTML = html;
}

function editSkillEffect(skillId, index, type) {
    const skill = GAME_CONFIG.SKILLS[skillId];
    const effects = (type === 'target') ? (skill.targetEffects || []) : (skill.selfEffects || []);
    const targetEffect = effects[index];

    STATE.tempOnConfirm = (newConfig) => {
        effects[index] = { ...effects[index], ...newConfig };
        addLog(`✅ 已更新技能状态实例数值`, "amber");
    };

    pushEditorState(showCreateEffectForm, {
        isInstance: true,
        baseEffect: targetEffect
    });
}

function confirmBindEffectToSkill(skillId, type) {
    const skill = skillId === 'temp' ? STATE.tempNewSkill : GAME_CONFIG.SKILLS[skillId];
    const id = document.getElementById(`new-skill-eff-id-${type}`).value;
    const duration = parseInt(document.getElementById(`new-skill-eff-dur-${type}`).value) || 3;

    if (type === 'target') {
        if (!skill.targetEffects) skill.targetEffects = skill.effectId ? [{id: skill.effectId, duration: skill.effectDuration}] : [];
        skill.targetEffects.push({id, duration});
        skill.effectId = null;
    } else {
        if (!skill.selfEffects) skill.selfEffects = [];
        skill.selfEffects.push({id, duration});
    }

    addLog(`✅ 技能「${skill.name}」已添加状态`, "amber");
    popEditorState();
}

function removeEffectFromSkill(skillId, index, type) {
    const skill = skillId === 'temp' ? STATE.tempNewSkill : GAME_CONFIG.SKILLS[skillId];
    if (type === 'target') {
        if (skill.targetEffects) skill.targetEffects.splice(index, 1);
        else if (skill.effectId) skill.effectId = null;
    } else {
        if (skill.selfEffects) skill.selfEffects.splice(index, 1);
    }

    if (skillId === 'temp') showAddSkillForm(false);
    else renderSkillEffectBinding(skillId);
}

function confirmEditSkill(skillId) {
    const skill = GAME_CONFIG.SKILLS[skillId];
    skill.emoji = document.getElementById("new-skill-emoji").value;
    skill.name = document.getElementById("new-skill-name").value;
    skill.manaCost = parseInt(document.getElementById("new-skill-cost").value);
    skill.range = parseInt(document.getElementById("new-skill-range").value);
    skill.damage = parseInt(document.getElementById("new-skill-dmg").value);
    skill.desc = document.getElementById("new-skill-desc").value;

    addLog(`✅ 技能「${skill.name}」已更新`, "amber");
    popEditorState();
}

function showAddSkillForm(isInit = true) {
    if (isInit && !STATE.tempNewSkill) {
        STATE.tempNewSkill = {
            emoji: "✨",
            name: "新技能",
            manaCost: 4,
            range: 2,
            damage: 12,
            desc: "",
            targetEffects: [],
            selfEffects: []
        };
    }

    const s = STATE.tempNewSkill;
    const container = document.getElementById("edit-unit-form");
    const html = `
        <div class="bg-slate-900 border border-purple-500/30 rounded-[32px] p-6 space-y-6 shadow-2xl">
            <div class="text-purple-400 text-xs font-bold mb-4 uppercase tracking-widest">新增独立技能</div>
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div><label class="block text-[10px] font-bold text-slate-500 mb-1">图标</label><input id="new-skill-emoji" value="${s.emoji}" class="editor-input w-full px-4 py-2 rounded-xl text-center text-xl"></div>
                    <div><label class="block text-[10px] font-bold text-slate-500 mb-1">名称</label><input id="new-skill-name" value="${s.name}" class="editor-input w-full px-4 py-2 rounded-xl"></div>
                </div>
                <div class="grid grid-cols-3 gap-3">
                    <div><label class="block text-[10px] font-bold text-slate-500 mb-1">蓝耗</label><input id="new-skill-cost" type="number" value="${s.manaCost}" class="editor-input w-full px-4 py-2 rounded-xl text-center font-mono"></div>
                    <div><label class="block text-[10px] font-bold text-slate-500 mb-1">范围</label><input id="new-skill-range" type="number" value="${s.range}" class="editor-input w-full px-4 py-2 rounded-xl text-center font-mono"></div>
                    <div><label class="block text-[10px] font-bold text-slate-500 mb-1">伤害</label><input id="new-skill-dmg" type="number" value="${s.damage}" class="editor-input w-full px-4 py-2 rounded-xl text-center font-mono"></div>
                </div>
                <div><label class="block text-[10px] font-bold text-slate-500 mb-1">技能描述</label><input id="new-skill-desc" value="${s.desc}" class="editor-input w-full px-4 py-2 rounded-xl"></div>

                <div id="skill-effect-binding-container"></div>

                <div class="flex gap-2">
                    <button onclick="confirmAddSkill()" class="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all">确认新增</button>
                    <button onclick="popEditorState()" class="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all">取消</button>
                </div>
            </div>
        </div>`;
    container.innerHTML = html;
    renderSkillEffectBinding('temp');
}

function syncTempSkill() {
    const s = STATE.tempNewSkill;
    s.emoji = document.getElementById("new-skill-emoji").value;
    s.name = document.getElementById("new-skill-name").value;
    s.manaCost = parseInt(document.getElementById("new-skill-cost").value);
    s.range = parseInt(document.getElementById("new-skill-range").value);
    s.damage = parseInt(document.getElementById("new-skill-dmg").value);
    s.desc = document.getElementById("new-skill-desc").value;
}

function confirmAddSkill() {
    syncTempSkill();
    const s = STATE.tempNewSkill;
    const { emoji, name, manaCost, range, damage, desc, targetEffects, selfEffects } = s;

    const skillId = "custom_" + Date.now();
    GAME_CONFIG.SKILLS[skillId] = { emoji, name, manaCost, range, damage, desc, targetEffects, selfEffects };

    const unit = getUnit(STATE.editingUnit.team, STATE.editingUnit.id);
    if (!unit.normalSkills) unit.normalSkills = [];
    unit.normalSkills.push(skillId);

    addLog(`✅ 新技能已独立添加到单位：${emoji} ${name}`, "purple");
    popEditorState();
}

function saveCurrentEdit() {
    if (!STATE.editingUnit || STATE.editingUnit.pendingAdd) return;
    const unit = getUnit(STATE.editingUnit.team, STATE.editingUnit.id);

    unit.emoji = document.getElementById("edit-emoji").value || unit.emoji;
    unit.name = document.getElementById("edit-name").value || unit.name;

    if (!STATE.editingUnit.isTerrain) {
        unit.atk = parseInt(document.getElementById("edit-atk").value) || 0;
        unit.def = parseInt(document.getElementById("edit-def").value) || 0;
        unit.mana = parseInt(document.getElementById("edit-mana").value) || 0;
        unit.moveRange = parseInt(document.getElementById("edit-move").value) || 0;
        unit.atkRange = parseInt(document.getElementById("edit-atkRange").value) || 0;
        unit.hp = parseInt(document.getElementById("edit-hp").value) || unit.hp;
        if (unit.maxHp) unit.maxHp = unit.hp;
        unit.ultSkill = document.getElementById("edit-ult-skill").value;
    }

    addLog(`✅ 已保存 <span class="text-purple-400">${unit.emoji} ${unit.name}</span> 的独立修改`, "purple");
    renderBoard();
    renderEditForm();
    updateAllLists();
}

function deleteCurrentUnit() {
    if (!STATE.editingUnit || STATE.editingUnit.pendingAdd) return;
    if (STATE.editingUnit.team === "terrain") STATE.terrainUnits = STATE.terrainUnits.filter(t => t.id !== STATE.editingUnit.id);
    else if (STATE.editingUnit.team === "friendly") STATE.friendlyUnits = STATE.friendlyUnits.filter(u => u.id !== STATE.editingUnit.id);
    else if (STATE.editingUnit.team === "enemy") STATE.enemyUnits = STATE.enemyUnits.filter(u => u.id !== STATE.editingUnit.id);

    addLog("🗑️ 已删除单位", "rose");
    STATE.editingUnit = null;
    renderBoard();
    updateAllLists();
    renderEditForm();
}

function copySelectedUnit() {
    if (!STATE.editingUnit || STATE.editingUnit.pendingAdd) return;
    const sourceUnit = getUnit(STATE.editingUnit.team, STATE.editingUnit.id);
    if (!sourceUnit) return;

    // 提示用户点击空格子放置
    addLog("📋 请点击附近空格子放置复制单位（新单位完全独立）", "amber");
    STATE.editingUnit = { ...STATE.editingUnit, pendingCopy: true, sourceId: STATE.editingUnit.id };
    renderEditForm();
}

function createNewUnitHere(team) {
    if (!STATE.editingUnit || !STATE.editingUnit.pendingAdd) return;
    const row = STATE.editingUnit.row;
    const col = STATE.editingUnit.col;
    const id = (team === "friendly" ? "f_new_" : team === "enemy" ? "e_new_" : "t_new_") + Date.now();

    if (team === "friendly" || team === "enemy") {
        const type = team === "friendly" ? "knight" : "heavy";
        const newUnit = createCombatUnit({id, type, row, col});
        if (team === "friendly") STATE.friendlyUnits.push(newUnit);
        else STATE.enemyUnits.push(newUnit);
    } else {
        const template = GAME_CONFIG.UNIT_TYPES.manaPoint;
        const newTerrain = { id, type: "manaPoint", row, col, ...template };
        STATE.terrainUnits.push(newTerrain);
    }

    addLog(`+ 在格子(${row},${col})新增单位`, team === "friendly" ? "emerald" : team === "enemy" ? "rose" : "amber");
    STATE.editingUnit = null;
    renderBoard();
    updateAllLists();
    renderEditForm();
}

function addNewUnitAtSelectedCell() {
    // 已由 createNewUnitHere 处理
}

/* UI 更新（已适配浮动面板） */
function toggleInfoPanel(show) {
    const wrapper = document.getElementById("info-panel-wrapper");
    if (show) {
        wrapper.classList.remove("translate-y-full", "sm:translate-x-full");
        wrapper.classList.add("translate-y-0", "sm:translate-x-0");
    } else {
        wrapper.classList.add("translate-y-full", "sm:translate-x-full");
        wrapper.classList.remove("translate-y-0", "sm:translate-x-0");
    }
}

function updateSelectedPanel() {
    const panel = document.getElementById("selected-panel");
    const editor = document.getElementById("editor-panel");

    if (!STATE.selected) {
        if (!STATE.editMode) {
            panel.classList.add("hidden");
            toggleInfoPanel(false);
        }
        return;
    }

    const entity = getUnit(STATE.selected.team, STATE.selected.id);
    if (!entity) {
        if (!STATE.editMode) {
            panel.classList.add("hidden");
            toggleInfoPanel(false);
        }
        return;
    }

    // 确保显示信息面板而非编辑器（非编辑模式下）
    if (!STATE.editMode) {
        panel.classList.remove("hidden");
        editor.classList.add("hidden");
        toggleInfoPanel(true);
    }

    const isTerrain = STATE.selected.team === "terrain";
    const isFriendly = STATE.selected.team === "friendly";

    document.getElementById("selected-emoji").innerHTML = entity.emoji;
    document.getElementById("selected-name").textContent = entity.name;

    const effectsContainer = document.getElementById("active-effects-list");
    effectsContainer.innerHTML = "";

    if (isTerrain) {
        document.getElementById("selected-team").innerHTML = `<span class="bg-slate-500/30 text-slate-300 border border-slate-500/50 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">地形</span>`;
        document.getElementById("unit-stats").classList.add("hidden");
        document.getElementById("skill-selection").classList.add("hidden");
        document.getElementById("terrain-desc").classList.remove("hidden");
        document.getElementById("terrain-desc-text").innerHTML = entity.desc || "无特殊描述";

        // 地形特有状态 (它赋予的状态)
        if (entity.effectId) {
            const config = EFFECT_HANDLERS.getConfig(entity.effectConfig || { id: entity.effectId });
            const div = document.createElement("div");
            div.className = `px-3 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 cursor-pointer hover:brightness-125 transition-all`;
            div.innerHTML = `<span class="opacity-60 text-[8px] border border-indigo-500/50 px-1 rounded">${entity.effectIsTrigger ? '触发' : '固有'}</span> ${config.emoji} ${config.name}`;
            div.onclick = (e) => showStatusDetail(e, entity.effectConfig || { id: entity.effectId }, true);
            effectsContainer.appendChild(div);
        }
    } else {
        document.getElementById("selected-team").innerHTML = isFriendly
            ? `<span class="bg-emerald-500/30 text-emerald-400 border border-emerald-500/50 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">友方单位</span>`
            : `<span class="bg-rose-500/30 text-rose-400 border border-rose-500/50 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">敌方单位</span>`;
        document.getElementById("unit-stats").classList.remove("hidden");
        document.getElementById("terrain-desc").classList.add("hidden");

        const hpPercent = Math.max(0, Math.round((entity.hp / entity.maxHp) * 100));
        const hpFill = document.getElementById("selected-hp-fill");
        hpFill.style.width = hpPercent + "%";
        hpFill.className = `hp-fill ${isFriendly ? "bg-gradient-to-r from-emerald-600 to-emerald-400" : "bg-gradient-to-r from-rose-600 to-rose-400"}`;
        document.getElementById("selected-hp-text").innerHTML = `${entity.hp} <span class="opacity-40">/</span> ${entity.maxHp}`;

        const atkMod = EFFECT_HANDLERS.getStatModifier(entity,'atk');
        const atkEl = document.getElementById("selected-atk");
        atkEl.innerHTML = `
            ${getEffectiveAtk(entity)}
            ${atkMod.total !== 0 ? `<span class="text-xs ${atkMod.total > 0 ? 'text-emerald-400' : 'text-rose-400'} font-bold cursor-pointer underline decoration-dotted">(${atkMod.total > 0 ? '+' : ''}${atkMod.total})</span>` : ''}`;
        atkEl.onclick = (e) => showStatDetail(e, entity, "atk", "攻击力");

        const defMod = EFFECT_HANDLERS.getStatModifier(entity,'def');
        const defEl = document.getElementById("selected-def");
        defEl.innerHTML = `
            ${getEffectiveDef(entity)}
            ${defMod.total !== 0 ? `<span class="text-xs ${defMod.total > 0 ? 'text-emerald-400' : 'text-rose-400'} font-bold cursor-pointer underline decoration-dotted">(${defMod.total > 0 ? '+' : ''}${defMod.total})</span>` : ''}`;
        defEl.onclick = (e) => showStatDetail(e, entity, "def", "防御力");

        const effMove = getEffectiveMoveRange(entity);
        const moveMod = EFFECT_HANDLERS.getStatModifier(entity,'move').total;
        const moveEl = document.getElementById("selected-remaining-move");
        moveEl.innerHTML = `
            <span class="text-emerald-400">${effMove}</span> <span class="text-xs opacity-30">/</span> <span class="opacity-60">${entity.moveRange}</span>
            ${moveMod !== 0 ? `<span class="text-[10px] ${moveMod > 0 ? 'text-emerald-400' : 'text-rose-400'} font-bold ml-1 cursor-pointer underline decoration-dotted">${moveMod > 0 ? '+' : ''}${moveMod}</span>` : ''}`;
        moveEl.onclick = (e) => showStatDetail(e, entity, "move", "移动范围");

        const effRange = getEffectiveAtkRange(entity);
        const rangeMod = EFFECT_HANDLERS.getStatModifier(entity,'range').total;
        const rangeEl = document.getElementById("selected-range");
        rangeEl.innerHTML = `
            <span class="text-rose-400">${effRange}</span>
            ${rangeMod !== 0 ? `<span class="text-xs ${rangeMod > 0 ? 'text-emerald-400' : 'text-rose-400'} font-bold cursor-pointer underline decoration-dotted">(${rangeMod > 0 ? '+' : ''}${rangeMod})</span>` : ''}`;
        rangeEl.onclick = (e) => showStatDetail(e, entity, "range", "攻击范围");

        document.getElementById("selected-mana").innerHTML = `
            <span class="text-cyan-400">${entity.currentMana}</span> <span class="text-xs opacity-30">/</span> <span class="opacity-60">${entity.maxMana}</span>`;

        const skillDiv = document.getElementById("skill-selection");
    }

    // 统一处理光环和活动效果 (战斗单位和地形都可能被影响)
    const auras = EFFECT_HANDLERS.calculateAurasForUnit(entity);
    const hasEffects = (entity.activeEffects && entity.activeEffects.length > 0) || auras.length > 0 || (isTerrain && entity.effectId);

    if (hasEffects) {
        // 普通状态
        entity.activeEffects?.forEach(eff => {
            const config = EFFECT_HANDLERS.getConfig(eff);
            const div = document.createElement("div");
            div.className = `px-3 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1.5 bg-${config.color}-500/20 text-${config.color}-300 border border-${config.color}-500/30 cursor-pointer hover:brightness-125 transition-all`;
            div.innerHTML = `${config.emoji} ${config.name} <span class="opacity-50">(${eff.remainingTurns}T)</span>`;
            div.onclick = (e) => showStatusDetail(e, eff);
            effectsContainer.appendChild(div);
        });
        // 光环状态
        auras.forEach(aura => {
            // 如果地形选中了自己，且显示了固有状态，则跳过重复的光环显示
            if (isTerrain && aura.id === entity.effectId) return;

            const div = document.createElement("div");
            div.className = `px-3 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 cursor-pointer hover:brightness-125 transition-all`;
            div.innerHTML = `${aura.icon} ${aura.sourceName} 的光环`;
            div.onclick = (e) => showStatusDetail(e, aura, true);
            effectsContainer.appendChild(div);
        });
    } else {
        effectsContainer.innerHTML = `<span class="text-slate-600 text-[10px] font-bold uppercase tracking-widest">无活动效果</span>`;
    }

    if (!isTerrain) {
        const skillDiv = document.getElementById("skill-selection");
        skillDiv.classList.remove("hidden");
        skillsList.innerHTML = "";

        titleEl.innerHTML = isFriendly
            ? `<span class="text-cyan-400">⚡</span> 技能指令`
            : `<span class="text-rose-400">👁️</span> 技能预览`;

        const skillIds = (entity.normalSkills || []).concat(entity.ultSkill ? [entity.ultSkill] : []);

        skillIds.forEach(skillId => {
            const skill = GAME_CONFIG.SKILLS[skillId];
            if (!skill) return;
            const canUse = entity.currentMana >= skill.manaCost;
            const btn = document.createElement("button");
            btn.className = `flex items-center gap-4 px-5 py-4 rounded-2xl text-left w-full transition-all active:scale-[0.98] ${isFriendly && canUse ? "bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-100" : "bg-slate-800/40 hover:bg-slate-800/60 border border-white/5 text-slate-300"}`;

            // 自动生成带标签的描述
            let extraDesc = "";
            const tEffs = skill.targetEffects || (skill.effectId ? [{id: skill.effectId, duration: skill.effectDuration}] : []);
            const sEffs = skill.selfEffects || [];

            if (tEffs.length > 0) {
                extraDesc += `<div class="mt-2 flex flex-wrap gap-1">
                    <span class="text-[8px] bg-rose-500/20 text-rose-300 px-1 rounded">对目标:</span>
            ${tEffs.map((e, idx) => {
                const config = EFFECT_HANDLERS.getConfig(e);
                return `<span class="status-tag" data-skill-id="${skillId}" data-eff-idx="${idx}" data-eff-type="target">${config.emoji} ${config.name}</span>`;
            }).join("")}
                </div>`;
            }
            if (sEffs.length > 0) {
                extraDesc += `<div class="mt-1 flex flex-wrap gap-1">
                    <span class="text-[8px] bg-emerald-500/20 text-emerald-300 px-1 rounded">对自己:</span>
            ${sEffs.map((e, idx) => {
                const config = EFFECT_HANDLERS.getConfig(e);
                return `<span class="status-tag" data-skill-id="${skillId}" data-eff-idx="${idx}" data-eff-type="self">${config.emoji} ${config.name}</span>`;
            }).join("")}
                </div>`;
            }

            btn.innerHTML = `
                <span class="text-4xl filter drop-shadow-lg">${skill.emoji}</span>
                <div class="flex-1">
                    <div class="font-bold flex justify-between items-center">
                        <span>${skill.name}</span>
                        <span class="font-mono text-xs text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded">${skill.manaCost} MP</span>
                    </div>
                    <div class="text-[10px] text-slate-400 mt-1 leading-tight">${skill.desc}</div>
                    ${extraDesc}
                    <div class="text-[10px] font-bold text-rose-400/70 mt-1 uppercase tracking-tighter">威力 ${skill.damage} • 射程 ${skill.range}</div>
                </div>
            `;

            // 为标签绑定点击事件
            btn.querySelectorAll(".status-tag").forEach(tag => {
                tag.onclick = (e) => {
                    e.stopPropagation();
            const sid = tag.dataset.skillId;
            const idx = parseInt(tag.dataset.effIdx);
            const type = tag.dataset.effType;
            const skill = GAME_CONFIG.SKILLS[sid];
            const effs = type === 'target' ? (skill.targetEffects || (skill.effectId ? [{id: skill.effectId, duration: skill.effectDuration}] : [])) : (skill.selfEffects || []);
            const effect = effs[idx];
            showStatusDetail(e, effect);
                };
            });

            btn.onclick = () => {
                if (isFriendly && canUse && STATE.currentTurn === "player") {
                    activateSkill(skillId);
                } else {
                    if (STATE.previewTimeout) clearTimeout(STATE.previewTimeout);
                    highlightSkillRange(entity, skillId);
                    STATE.previewTimeout = setTimeout(() => renderBoard(), 2800);
                    addLog(`预览${isFriendly ? '友方' : '敌方'}技能范围：${skill.emoji} ${skill.name}`, "cyan");
                }
            };
            skillsList.appendChild(btn);
        });
    }
    panel.classList.remove("hidden");
}

function updateAllLists() {
    const fList = document.getElementById("friendly-list");
    if (!fList) return;
    fList.innerHTML = "";
    STATE.friendlyUnits.forEach(u => {
        if (u.hp <= 0) return;
        const percent = Math.round((u.hp / u.maxHp) * 100);
        const div = document.createElement("div");
        div.className = "flex items-center gap-3 bg-emerald-900/30 px-3 py-2 rounded-2xl text-xs cursor-pointer hover:bg-emerald-900/50 transition-colors";
        div.onclick = () => selectUnit("friendly", u.id);
        div.innerHTML = `<span class="text-2xl">${u.emoji}</span><div class="flex-1"><div class="font-medium">${u.name}</div><div class="hp-bar w-full"><div class="hp-fill bg-emerald-400" style="width:${percent}%"></div></div></div><span class="font-mono">${u.hp}</span>`;
        fList.appendChild(div);
    });

    const eList = document.getElementById("enemy-list");
    if (!eList) return;
    eList.innerHTML = "";
    STATE.enemyUnits.forEach(u => {
        if (u.hp <= 0) return;
        const percent = Math.round((u.hp / u.maxHp) * 100);
        const div = document.createElement("div");
        div.className = "flex items-center gap-3 bg-rose-900/30 px-3 py-2 rounded-2xl text-xs cursor-pointer hover:bg-rose-900/50 transition-colors";
        div.onclick = () => selectUnit("enemy", u.id);
        div.innerHTML = `<span class="text-2xl">${u.emoji}</span><div class="flex-1"><div class="font-medium">${u.name}</div><div class="hp-bar w-full"><div class="hp-fill bg-rose-400" style="width:${percent}%"></div></div></div><span class="font-mono">${u.hp}</span>`;
        eList.appendChild(div);
    });
}

function checkGameOver() { if (STATE.friendlyUnits.every(u => u.hp <= 0)) setTimeout(() => showResult(false), 300); else if (STATE.enemyUnits.every(u => u.hp <= 0)) setTimeout(() => showResult(true), 300); }
function updateUI() {
    const turnEl = document.getElementById("turn-team");
    turnEl.innerHTML = STATE.currentTurn === "player" ? "🟦 玩家回合" : "🔴 敌方回合";
    turnEl.className = `turn-indicator font-black ${STATE.currentTurn === "player" ? "text-emerald-400" : "text-rose-400"}`;
    document.getElementById("turn-number").textContent = String(STATE.turnCount).padStart(2, "0");
    document.getElementById("log-turn").textContent = STATE.turnCount;
    const endBtn = document.getElementById("end-turn-btn");
    endBtn.disabled = STATE.currentTurn !== "player";
    endBtn.style.opacity = STATE.currentTurn === "player" ? "1" : "0.5";
    endBtn.style.filter = STATE.currentTurn === "player" ? "" : "grayscale(1)";
}

/**
 * ====================== Tooltip 气泡系统 ======================
 */
const TooltipManager = {
    timer: null,
    activeAnchor: null,

    show(anchor, contentHtml) {
        this.activeAnchor = anchor;
        const tooltip = document.getElementById("tooltip");
        tooltip.innerHTML = contentHtml;
        tooltip.classList.remove("hidden");
        tooltip.style.pointerEvents = "auto";

        // 强制重绘
        tooltip.offsetHeight;

        const rect = anchor.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();

        // 计算位置：默认在上方居中
        let top = rect.top - tooltipRect.height - 10;
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);

        // 边界检查
        if (top < 10) { // 如果上方空间不足，显示在下方
            top = rect.bottom + 10;
            tooltip.style.transformOrigin = "top";
        } else {
            tooltip.style.transformOrigin = "bottom";
        }

        left = Math.max(10, Math.min(window.innerWidth - tooltipRect.width - 10, left));

        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
        tooltip.style.opacity = "1";
        tooltip.style.transform = "scale(1)";

        // 点击外部关闭
        const closeHandler = (e) => {
            if (!tooltip.contains(e.target) && !anchor.contains(e.target)) {
                this.hide();
                document.removeEventListener("click", closeHandler);
            }
        };
        setTimeout(() => document.addEventListener("click", closeHandler), 10);
    },

    hide() {
        const tooltip = document.getElementById("tooltip");
        tooltip.style.opacity = "0";
        tooltip.style.transform = "scale(0.95)";
        tooltip.style.pointerEvents = "none";
        setTimeout(() => {
            if (tooltip.style.opacity === "0") tooltip.classList.add("hidden");
        }, 200);
        this.activeAnchor = null;
    }
};

function showStatDetail(event, unit, statName, statLabel) {
    const modData = EFFECT_HANDLERS.getStatModifier(unit, statName);
    const baseValue = (statName === "atk") ? unit.atk :
                     (statName === "def") ? unit.def :
                     (statName === "move") ? unit.moveRange : unit.atkRange;

    let content = `
        <div class="space-y-3 min-w-[200px]">
            <div class="flex justify-between items-center border-b border-white/10 pb-2">
                <span class="text-slate-400 font-bold text-[10px] uppercase tracking-widest">${statLabel}</span>
                <span class="text-lg font-black text-white">${baseValue + modData.total}</span>
            </div>
            <div class="space-y-1.5">
                <div class="flex justify-between text-[11px]">
                    <span class="text-slate-500">基础数值</span>
                    <span class="font-mono text-slate-300">${baseValue}</span>
                </div>`;

    modData.sources.forEach(src => {
        const isPos = src.value > 0;
        content += `
            <div class="flex justify-between text-[11px]">
                <span class="text-slate-300 flex items-center gap-1"><span>${src.icon}</span> ${src.name}</span>
                <span class="font-mono font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}">${isPos ? '+' : ''}${src.value}</span>
            </div>`;
    });

    content += `</div></div>`;
    TooltipManager.show(event.currentTarget, content);
}

function showStatusDetail(event, eff, isAura = false) {
    const config = EFFECT_HANDLERS.getConfig(eff);

    let content = `
        <div class="space-y-2">
            <div class="flex items-center gap-2 border-b border-white/10 pb-2">
                <span class="text-2xl">${config.emoji}</span>
                <div>
                    <div class="font-bold text-sm text-${config.color}-400">${config.name}</div>
                    <div class="text-[9px] text-slate-500 uppercase tracking-widest">
                        ${isAura ? `光环来自: ${eff.sourceName}` : `持续: ${eff.remainingTurns} 回合`}
                    </div>
                </div>
            </div>
            <p class="text-[11px] text-slate-300 leading-relaxed">${config.desc}</p>
            ${eff.stacks > 1 ? `<div class="text-[10px] text-amber-400 font-bold">当前叠加: ${eff.stacks} 层</div>` : ''}
        </div>`;

    TooltipManager.show(event.currentTarget, content);
}

function showGenericModal(title, htmlContent) {
    const modal = document.getElementById("result-modal");
    modal.classList.remove("hidden");
    document.getElementById("result-icon").innerHTML = "";
    document.getElementById("result-title").innerHTML = title;
    document.getElementById("result-text").innerHTML = htmlContent;

    // 使用独立按钮逻辑，避免污染胜负结算弹窗
    const btn = modal.querySelector("button");
    btn.textContent = "确定";
    btn.onclick = () => hideModal();
}

function showResult(isWin) {
    const modal = document.getElementById("result-modal");
    modal.classList.remove("hidden");
    const iconEl = document.getElementById("result-icon");
    const titleEl = document.getElementById("result-title");
    const textEl = document.getElementById("result-text");

    // 恢复按钮默认逻辑
    const btn = modal.querySelector("button");
    btn.textContent = "再来一局";
    btn.onclick = () => { hideModal(); resetGame(); };

    if (isWin) {
        iconEl.textContent = "🏆";
        titleEl.innerHTML = `<span class="text-emerald-400">胜利！</span>`;
        textEl.innerHTML = `你成功消灭了全部敌方单位！<br>共用 <span class="font-mono">${STATE.turnCount}</span> 回合`;
    } else {
        iconEl.textContent = "💀";
        titleEl.innerHTML = `<span class="text-rose-400">失败</span>`;
        textEl.innerHTML = `你的部队全军覆没…<br>下次再战！`;
    }
}
function hideModal() { document.getElementById("result-modal").classList.add("hidden"); }

function exportBoard() {
    const exportData = {
        unitTypes: GAME_CONFIG.UNIT_TYPES,
        skills: GAME_CONFIG.SKILLS,
        effects: EFFECT_LIBRARY,
        friendlyUnits: STATE.friendlyUnits,
        enemyUnits: STATE.enemyUnits,
        terrainUnits: STATE.terrainUnits,
        turnCount: STATE.turnCount,
        currentTurn: STATE.currentTurn
    };
    try {
        const yamlStr = jsyaml.dump(exportData);
        const blob = new Blob([yamlStr], { type: "text/yaml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `fire-emblem-board-turn${STATE.turnCount}.yaml`;
        a.click();
        URL.revokeObjectURL(url);
        addLog("✅ 棋盘已导出为 YAML 文件（含所有自定义修改）", "emerald");
    } catch (e) {
        addLog("❌ 导出失败: " + e.message, "rose");
    }
}

function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
        try {
            const imported = jsyaml.load(ev.target.result);
            if (imported.unitTypes) Object.assign(GAME_CONFIG.UNIT_TYPES, imported.unitTypes);
            if (imported.skills) Object.assign(GAME_CONFIG.SKILLS, imported.skills);
            if (imported.effects) Object.assign(EFFECT_LIBRARY, imported.effects);

            STATE.friendlyUnits = (imported.friendlyUnits || []).map(u => ({ ...u }));
            STATE.enemyUnits = (imported.enemyUnits || []).map(u => ({ ...u }));
            STATE.terrainUnits = (imported.terrainUnits || []).map(t => ({ ...t }));

            STATE.turnCount = imported.turnCount || 1;
            STATE.currentTurn = imported.currentTurn || "player";
            STATE.selected = null;
            STATE.selectedSkill = null;

            renderBoard();
            updateAllLists();
            updateUI();
            updateSelectedPanel();

            addLog("✅ 棋盘导入成功！已自动添加新单位/技能", "emerald");
        } catch (err) {
            addLog("❌ 导入失败: " + err.message, "rose");
        }
    };
    reader.readAsText(file);
    e.target.value = "";
}

function enemyTurn() {
    STATE.currentTurn = "enemy";
    updateUI();
    addLog("🔴 敌方回合开始...", "rose");
    let index = 0;
    const actNextEnemy = () => {
        if (index >= STATE.enemyUnits.length) { finishEnemyTurn(); return; }
        const enemy = STATE.enemyUnits[index];
        if (enemy.hp <= 0) { index++; actNextEnemy(); return; }

        // 【新增】敌方也检查效果禁用
        if (EFFECT_HANDLERS.isDisabled(enemy, "move") && EFFECT_HANDLERS.isDisabled(enemy, "attack")) {
            addLog(`${enemy.emoji} ${enemy.name} 被完全控制，本回合无法行动`, "slate");
            index++;
            setTimeout(actNextEnemy, 400);
            return;
        }

        let closest = null, minDist = Infinity;
        STATE.friendlyUnits.forEach(f => {
            if (f.hp > 0) {
                const dist = Math.abs(f.row - enemy.row) + Math.abs(f.col - enemy.col);
                if (dist < minDist) { minDist = dist; closest = f; }
            }
        });
        if (!closest) { index++; actNextEnemy(); return; }

        // 计算有效移动范围
        const effectiveMove = getEffectiveMoveRange(enemy);
        let bestR = enemy.row, bestC = enemy.col, bestDist = Infinity;

        // 只在能移动时寻找位置
        if (!EFFECT_HANDLERS.isDisabled(enemy, "move") && effectiveMove > 0) {
            for (let dr = -effectiveMove; dr <= effectiveMove; dr++) {
                for (let dc = -effectiveMove; dc <= effectiveMove; dc++) {
                    const nr = enemy.row + dr, nc = enemy.col + dc;
                    if (nr < 0 || nr >= GAME_CONFIG.BOARD_SIZE || nc < 0 || nc >= GAME_CONFIG.BOARD_SIZE) continue;
                    const terrain = STATE.terrainUnits.find(t => t.row === nr && t.col === nc);
                    if (terrain && GAME_CONFIG.UNIT_TYPES[terrain.type]?.impassable) continue;
                    let occupied = false;
                    [...STATE.friendlyUnits, ...STATE.enemyUnits].forEach(u => {
                        if (u.hp > 0 && u.row === nr && u.col === nc) occupied = true;
                    });
                    if (occupied) continue;
                    const newDist = Math.abs(nr - closest.row) + Math.abs(nc - closest.col);
                    if (newDist < bestDist) { bestDist = newDist; bestR = nr; bestC = nc; }
                }
            }
        }

        const fromRow = enemy.row, fromCol = enemy.col;
        enemy.row = bestR; enemy.col = bestC;
        addLog(`<span class="text-rose-400">${enemy.emoji} ${enemy.name}</span> 移动到 (${bestR},${bestC})`, "rose");
        AnimationManager.animateMove(fromRow, fromCol, bestR, bestC, enemy.emoji);
        applyTerrainEffect(enemy);
        renderBoard();

        const afterDist = Math.abs(bestR - closest.row) + Math.abs(bestC - closest.col);

        // 技能 / 攻击也检查禁用
        let usedSkill = false;
        if (!EFFECT_HANDLERS.isDisabled(enemy, "skill")) {
            const possibleSkills = (enemy.normalSkills || []).concat(enemy.ultSkill ? [enemy.ultSkill] : []);
            let bestSkill = null, bestDmg = 0;
            for (let sid of possibleSkills) {
                const sk = GAME_CONFIG.SKILLS[sid];
                if (sk && enemy.currentMana >= sk.manaCost && isInRange(enemy, closest.row, closest.col, sk.range)) {
                    const dmg = Math.max(1, sk.damage - closest.def);
                    if (dmg > bestDmg) { bestDmg = dmg; bestSkill = sid; }
                }
            }
            if (bestSkill) {
                const skill = GAME_CONFIG.SKILLS[bestSkill];
                performSkill(enemy, bestSkill, closest);
                enemy.currentMana -= skill.manaCost;
                enemy.skillUsedThisTurn = true;
                usedSkill = true;
            }
        }

        if (!usedSkill && !EFFECT_HANDLERS.isDisabled(enemy, "attack") && afterDist <= getEffectiveAtkRange(enemy)) {
            performAttack(enemy, closest);
        }

        renderBoard();
        updateAllLists();
        checkGameOver();
        index++;
        setTimeout(actNextEnemy, usedSkill || afterDist <= getEffectiveAtkRange(enemy) ? 700 : 400);
    };
    setTimeout(actNextEnemy, 800);
}

function finishEnemyTurn() {
    STATE.currentTurn = "player";
    STATE.turnCount++;
    applyManaRegen("enemy");
    resetActionsForTeam("friendly");
    tickAllEffects();
    STATE.selectedSkill = null;
    generatePowerUp();
    renderBoard();
    updateUI();
    updateSelectedPanel();
    addLog("✅ 敌方回合结束，轮到你了！", "emerald");
}

function endPlayerTurn() {
    if (STATE.currentTurn !== "player") return;
    deselectUnit();
    applyManaRegen("friendly");
    tickAllEffects();
    enemyTurn();
}

function applyManaRegen(team) {
    const units = team === "friendly" ? STATE.friendlyUnits : STATE.enemyUnits;
    let anyRegen = false;
    units.forEach(u => {
        if (u.hp > 0 && !u.skillUsedThisTurn) {
            u.currentMana = Math.min(u.maxMana, u.currentMana + 2);
            anyRegen = true;
        }
    });
    if (team === "friendly" && anyRegen) addLog(`本回合未使用技能，友方单位回复 <span class="font-mono">2</span> 蓝量`, "cyan");
}

function resetActionsForTeam(team) {
    const units = team === "friendly" ? STATE.friendlyUnits : STATE.enemyUnits;
    units.forEach(u => {
        if (u.hp > 0) {
            u.remainingMove = u.moveRange;
            u.hasAttacked = false;
            u.forestModifier = false;
            u.skillUsedThisTurn = false;
        }
    });
}

function generatePowerUp() {
    let candidates = [];
    for (let r = 0; r < GAME_CONFIG.BOARD_SIZE; r++) {
        for (let c = 0; c < GAME_CONFIG.BOARD_SIZE; c++) {
            const hasUnit = [...STATE.friendlyUnits, ...STATE.enemyUnits].some(u => u.hp > 0 && u.row === r && u.col === c);
            const hasTerrain = STATE.terrainUnits.some(t => t.row === r && t.col === c);
            if (!hasUnit && !hasTerrain) candidates.push({r, c});
        }
    }
    if (candidates.length === 0) return;
    const pos = candidates[Math.floor(Math.random() * candidates.length)];
    const type = Math.random() > 0.5 ? "manaPoint" : "healPoint";
    const id = "pu_" + Date.now();
    const template = GAME_CONFIG.UNIT_TYPES[type];
    STATE.terrainUnits.push({ id, type, row: pos.r, col: pos.c, ...template });
    addLog(`生成新地形 <span class="text-cyan-400">${template.emoji} ${template.name}</span>`, "cyan");
}

function resetGame() {
    STATE.reset();   // 使用类方法

    STATE.friendlyUnits = GAME_CONFIG.INITIAL.friendly.map(createCombatUnit);
    STATE.enemyUnits = GAME_CONFIG.INITIAL.enemy.map(createCombatUnit);
    STATE.terrainUnits = GAME_CONFIG.INITIAL.terrain.map(base => {
        const template = GAME_CONFIG.UNIT_TYPES[base.type];
        return { id: base.id, type: base.type, row: base.row, col: base.col, ...template };
    });

    document.getElementById("log-container").innerHTML = "";
    addLog("🎮 新一局开始！友方 2 单位 vs 敌方 2 单位", "emerald");
    addLog("地图上已生成 <span class='text-amber-300'>山峰、河流、森林</span> 地形", "amber");
    addLog("点击任意格子（含空格）可新增/复制单位 • 编辑模式下位置可移动", "cyan");

    resetActionsForTeam("friendly");
    resetActionsForTeam("enemy");
    generatePowerUp();

    renderBoard();
    updateAllLists();
    updateUI();
    updateSelectedPanel();
    exitEditMode();
    clearAnimationOverlay();
    cellCache.clear();
}

function initGame() {
    initializeSkills();   // 初始化 Skill 类
    resetGame();
}

window.onload = initGame;
