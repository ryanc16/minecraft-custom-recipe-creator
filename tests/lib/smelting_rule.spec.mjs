import { SmeltingRule } from "../../lib/rules/smelting_rule.mjs";

describe('SmeltingRule', () => {

    it('can generate a simple smelting recipe using single word item types', () => {
        const rule = SmeltingRule.parse("smelting a glass produces 12 potato");
        expect(rule.canBeSmelted()).toBeTrue();
        expect(rule.canBeBlasted()).toBeFalse();
        const recipe = rule.getSmeltingRecipe();

        expect(recipe.type).toEqual("minecraft:smelting");
        expect(recipe.ingredient).toBeInstanceOf(Array);
        expect(recipe.ingredient[0]).toEqual({ item: "minecraft:glass" });
        expect(recipe.result).toEqual({
            item: "minecraft:potato",
            count: 12
        });
        expect(recipe.cookingtime).toEqual(200);
        expect(recipe.experience).toEqual(0.1);
    });

    it('can generate a simple smelting recipe', () => {
        const rule = SmeltingRule.parse("smelting a raw_iron_block produces 9 iron_ingot");
        expect(rule.canBeSmelted()).toBeTrue();
        expect(rule.canBeBlasted()).toBeFalse();
        const recipe = rule.getSmeltingRecipe();

        expect(recipe.type).toEqual("minecraft:smelting");
        expect(recipe.ingredient).toBeInstanceOf(Array);
        expect(recipe.ingredient[0]).toEqual({ item: "minecraft:raw_iron_block" });
        expect(recipe.result).toEqual({
            item: "minecraft:iron_ingot",
            count: 9
        });
        expect(recipe.cookingtime).toEqual(200);
        expect(recipe.experience).toEqual(0.1);
    });

    it('can generate a simple blasting recipe', () => {
        const rule = SmeltingRule.parse("blasting a raw_iron_block produces 9 iron_ingot");
        expect(rule.canBeBlasted()).toBeTrue();
        expect(rule.canBeSmelted()).toBeFalse();
        const recipe = rule.getBlastingRecipe();

        expect(recipe.type).toEqual("minecraft:blasting");
        expect(recipe.ingredient).toBeInstanceOf(Array);
        expect(recipe.ingredient[0]).toEqual({ item: "minecraft:raw_iron_block" });
        expect(recipe.result).toEqual({
            item: "minecraft:iron_ingot",
            count: 9
        });
        expect(recipe.cookingtime).toEqual(100);
        expect(recipe.experience).toEqual(0.1);
    });

    it('can set the cookingtime for a smelting recipe', () => {
        const rule = SmeltingRule.parse("smelting a raw_iron_block produces 9 iron_ingot and takes 1800 ticks");
        expect(rule.canBeSmelted()).toBeTrue();
        expect(rule.canBeBlasted()).toBeFalse();
        const recipe = rule.getSmeltingRecipe();

        expect(recipe.type).toEqual("minecraft:smelting");
        expect(recipe.ingredient).toBeInstanceOf(Array);
        expect(recipe.ingredient[0]).toEqual({ item: "minecraft:raw_iron_block" });
        expect(recipe.result).toEqual({
            item: "minecraft:iron_ingot",
            count: 9
        });
        expect(recipe.cookingtime).toEqual(1800);
        expect(recipe.experience).toEqual(0.1);
    });

    it('can set the experience granted for a smelting recipe', () => {
        const rule = SmeltingRule.parse("smelting a raw_iron_block produces 9 iron_ingot and grants 0.9 experience");
        expect(rule.canBeSmelted()).toBeTrue();
        expect(rule.canBeBlasted()).toBeFalse();
        const recipe = rule.getSmeltingRecipe();

        expect(recipe.type).toEqual("minecraft:smelting");
        expect(recipe.ingredient).toBeInstanceOf(Array);
        expect(recipe.ingredient[0]).toEqual({ item: "minecraft:raw_iron_block" });
        expect(recipe.result).toEqual({
            item: "minecraft:iron_ingot",
            count: 9
        });
        expect(recipe.cookingtime).toEqual(200);
        expect(recipe.experience).toEqual(0.9);
    });

    it('can create a complex recipe that sets all effect types', () => {
        const rule = SmeltingRule.parse("smelting or blasting a raw_iron_block produces 9 iron_ingot and grants 0.9 experience and takes 1800 ticks");
        expect(rule.canBeSmelted()).toBeTrue();
        expect(rule.canBeBlasted()).toBeTrue();
        const smeltingRecipe = rule.getSmeltingRecipe();

        expect(smeltingRecipe.type).toEqual("minecraft:smelting");
        expect(smeltingRecipe.ingredient).toBeInstanceOf(Array);
        expect(smeltingRecipe.ingredient[0]).toEqual({ item: "minecraft:raw_iron_block" });
        expect(smeltingRecipe.result).toEqual({
            item: "minecraft:iron_ingot",
            count: 9
        });
        expect(smeltingRecipe.cookingtime).toEqual(1800);
        expect(smeltingRecipe.experience).toEqual(0.9);

        const blastingRecipe = rule.getBlastingRecipe();
        expect(blastingRecipe.type).toEqual("minecraft:blasting");
        expect(blastingRecipe.ingredient).toBeInstanceOf(Array);
        expect(blastingRecipe.ingredient[0]).toEqual({ item: "minecraft:raw_iron_block" });
        expect(blastingRecipe.result).toEqual({
            item: "minecraft:iron_ingot",
            count: 9
        });
        expect(blastingRecipe.cookingtime).toEqual(1800);
        expect(blastingRecipe.experience).toEqual(0.9);
    });

    it('can parse an item reference including its namespace', () => {
        const rule = SmeltingRule.parse("smelting a custommod:custom_block produces 2 custommod:custom_item");
        expect(rule.canBeSmelted()).toBeTrue();
        expect(rule.canBeBlasted()).toBeFalse();
        const recipe = rule.getSmeltingRecipe();

        expect(recipe.type).toEqual("minecraft:smelting");
        expect(recipe.ingredient).toBeInstanceOf(Array);
        expect(recipe.ingredient[0]).toEqual({ item: "custommod:custom_block" });
        expect(recipe.result).toEqual({
            item: "custommod:custom_item",
            count: 2
        });
        expect(recipe.cookingtime).toEqual(200);
        expect(recipe.experience).toEqual(0.1);
    });

    it('can generate a smelting recipe for multiple input items', () => {
        const rule = SmeltingRule.parse("smelting of iron_pickaxe,iron_shovel,iron_axe,iron_hoe,iron_sword produces 1 iron_ingot");
        expect(rule.canBeSmelted()).toBeTrue();
        expect(rule.canBeBlasted()).toBeFalse();
        const recipe = rule.getSmeltingRecipe();

        expect(recipe.type).toEqual("minecraft:smelting");
        expect(recipe.ingredient).toBeInstanceOf(Array);
        expect(recipe.ingredient).toHaveSize(5);
        expect(recipe.ingredient).toEqual([
            { item: "minecraft:iron_pickaxe" },
            { item: "minecraft:iron_shovel" },
            { item: "minecraft:iron_axe" },
            { item: "minecraft:iron_hoe" },
            { item: "minecraft:iron_sword" }
        ]);
        expect(recipe.result).toEqual({
            item: "minecraft:iron_ingot",
            count: 1
        });
        expect(recipe.cookingtime).toEqual(200);
        expect(recipe.experience).toEqual(0.1);
    });

    describe('validation', () => {
        it('catches input item references that dont exist for a specified version of the game', () => {
            const rule = 'smelting an emerald_pickaxe produces 2 emeralds';
            expect(() => SmeltingRule.parse(rule, { validate: { version: '1.20.1' } }))
                .toThrowMatching((err) => err.message === 'validation: item "emerald_pickaxe" does not exist in minecraft version 1.20.1. If it comes from a mod, it needs to be prefixed with its namespace!');
        });

        it('catches output item references that dont exist for a specified version of the game', () => {
            const rule = 'smelting an iron_pickaxe produces 2 iron_ingots';
            expect(() => SmeltingRule.parse(rule, { validate: { version: '1.20.1' } }))
                .toThrowMatching((err) => err.message === 'validation: item "iron_ingots" does not exist in minecraft version 1.20.1. If it comes from a mod, it needs to be prefixed with its namespace!');
        });
    });

});