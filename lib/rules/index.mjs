import { ItemRule } from './item_rule.mjs';
import { SmeltingRule } from './smelting_rule.mjs';
import { AliasRule } from './alias_rule.mjs';
import { ParsingException } from './exceptions.mjs';
import { CraftingRule } from './crafting_rule.mjs';
import { StonecuttingRule } from './stonecutting_rule.mjs';

export class RuleRegistry {

    constructor() {
        this.registry = { items: {}, alias: {}, crafting: [], smelting: [], blasting: [], stonecutting: [] };
    }

    add(query) {
        const rule = RuleRegistry.parseRule(query);
        if (rule instanceof ItemRule) {
            if (item.hasVariants()) {
                for (const variant of item.getVariants()) {
                    this.add(`item ${variant} exists`);
                }
            }
            this.registry.items[item.getName()] = item;
        } else if (rule instanceof SmeltingRule) {
            if (rule.canBeSmelted()) {
                this.registry.smelting.push(rule);
            }
            if (rule.canBeBlasted()) {
                this.registry.blasting.push(rule);
            }
        } else if (rule instanceof CraftingRule) {
            this.registry.crafting.push(rule);
        } else if (rule instanceof Stonecuttingrule) {
            this.registry.stonecutting.push(rule);
        } else if (rule instanceof AliasRule) {
            if (alias) {
                this.registry.alias[alias.name] = alias.value;
            }
        }
    }

    static parseRule(query) {
        const ruleType = query.split(' ').shift();
        if (ruleType === 'item') {
            const rule = ItemRule.parse(query);
            return rule;
        } else if (['smelting', 'blasting'].includes(ruleType)) {
            const rule = SmeltingRule.parse(query);
            return rule;
        } else if (ruleType === 'crafting') {
            const rule = CraftingRule.parse(query);
            return rule;
        } else if (ruleType === 'stonecutting') {
            const rule = StonecuttingRule.parse(query);
            return rule;
        } else if (ruleType === 'alias') {
            const alias = AliasRule.parse(rule);
            return alias;
        } else {
            throw new ParsingException(`unknown rule for "${ruleType}"`);
        }
    }

    getAll() {
        return [].concat(this.registry.crafting).concat(this.registry.smelting).concat(this.registry.blasting).concat(this.registry.stonecutting);
    }
}
