import { CraftingRule } from "../../lib/rules/crafting_rule.mjs";
import { ParsingException } from "../../lib/rules/exceptions.mjs";

describe('CraftingRule', () => {

    describe('for shapeless recipes', () => {
        it('can generate a simple crafting recipe', () => {
            const rule = CraftingRule.parse("crafting leather requires leather_leggings");
            const recipe = rule.getCraftingRecipe();

            expect(recipe.type).toEqual("minecraft:crafting_shapeless");
            expect(recipe.ingredients).toBeInstanceOf(Array);
            expect(recipe.ingredients).toHaveSize(1);
            expect(recipe.ingredients[0]).toEqual({ item: "minecraft:leather_leggings" });
            expect(recipe.result).toEqual({
                item: "minecraft:leather",
                count: 1
            });
        });

        it('can generate a crafting recipe that uses numerical quantifier of input items', () => {
            const rule = CraftingRule.parse("crafting sand requires 2 quartz");
            const recipe = rule.getCraftingRecipe();

            expect(recipe.type).toEqual("minecraft:crafting_shapeless");
            expect(recipe.ingredients).toBeInstanceOf(Array);
            expect(recipe.ingredients).toHaveSize(2);
            expect(recipe.ingredients[0]).toEqual({ item: "minecraft:quartz" });
            expect(recipe.ingredients[1]).toEqual({ item: "minecraft:quartz" });
            expect(recipe.result).toEqual({
                item: "minecraft:sand",
                count: 1
            });
        });

        it('can generate a crafting recipe that uses implicit output item quantifier', () => {
            const rule1 = CraftingRule.parse("crafting a sand requires 2 quartz");
            const recipe1 = rule1.getCraftingRecipe();

            expect(recipe1.type).toEqual("minecraft:crafting_shapeless");
            expect(recipe1.ingredients).toBeInstanceOf(Array);
            expect(recipe1.ingredients).toHaveSize(2);
            expect(recipe1.ingredients[0]).toEqual({ item: "minecraft:quartz" });
            expect(recipe1.ingredients[1]).toEqual({ item: "minecraft:quartz" });
            expect(recipe1.result).toEqual({
                item: "minecraft:sand",
                count: 1
            });

            const rule2 = CraftingRule.parse("crafting an iron_door requires 6 iron_ingot");
            const recipe2 = rule2.getCraftingRecipe();

            expect(recipe2.type).toEqual("minecraft:crafting_shapeless");
            expect(recipe2.ingredients).toBeInstanceOf(Array);
            expect(recipe2.ingredients).toHaveSize(6);
            expect(recipe2.ingredients[0]).toEqual({ item: "minecraft:iron_ingot" });
            expect(recipe2.ingredients[1]).toEqual({ item: "minecraft:iron_ingot" });
            expect(recipe2.ingredients[2]).toEqual({ item: "minecraft:iron_ingot" });
            expect(recipe2.ingredients[3]).toEqual({ item: "minecraft:iron_ingot" });
            expect(recipe2.ingredients[4]).toEqual({ item: "minecraft:iron_ingot" });
            expect(recipe2.ingredients[5]).toEqual({ item: "minecraft:iron_ingot" });
            expect(recipe2.result).toEqual({
                item: "minecraft:iron_door",
                count: 1
            });
        });

        it('can generate a crafting recipe that specifies the output item quantity', () => {
            const rule = CraftingRule.parse("crafting 3 leather requires leather_leggings");
            const recipe = rule.getCraftingRecipe();

            expect(recipe.type).toEqual("minecraft:crafting_shapeless");
            expect(recipe.ingredients).toBeInstanceOf(Array);
            expect(recipe.ingredients).toHaveSize(1);
            expect(recipe.ingredients[0]).toEqual({ item: "minecraft:leather_leggings" });
            expect(recipe.result).toEqual({
                item: "minecraft:leather",
                count: 3
            });
        });

        it('can generate a crafting recipe that uses implicit input item quantifier', () => {
            const rule1 = CraftingRule.parse("crafting 3 leather requires a leather_helmet");
            const recipe1 = rule1.getCraftingRecipe();

            expect(recipe1.type).toEqual("minecraft:crafting_shapeless");
            expect(recipe1.ingredients).toBeInstanceOf(Array);
            expect(recipe1.ingredients).toHaveSize(1);
            expect(recipe1.ingredients[0]).toEqual({ item: "minecraft:leather_helmet" });
            expect(recipe1.result).toEqual({
                item: "minecraft:leather",
                count: 3
            });

            const rule2 = CraftingRule.parse("crafting 4 acacia_planks requires an acacia_log");
            const recipe2 = rule2.getCraftingRecipe();

            expect(recipe2.type).toEqual("minecraft:crafting_shapeless");
            expect(recipe2.ingredients).toBeInstanceOf(Array);
            expect(recipe2.ingredients).toHaveSize(1);
            expect(recipe2.ingredients[0]).toEqual({ item: "minecraft:acacia_log" });
            expect(recipe2.result).toEqual({
                item: "minecraft:acacia_planks",
                count: 4
            });
        });

        it('can generate a crafting recipe that uses multiple different items', () => {
            const rule = CraftingRule.parse('crafting a red_sand requires granite and sand');
            const recipe = rule.getCraftingRecipe();

            expect(recipe.type).toEqual('minecraft:crafting_shapeless');
            expect(recipe.ingredients).toBeInstanceOf(Array);
            expect(recipe.ingredients).toHaveSize(2);
            expect(recipe.ingredients[0]).toEqual({ item: "minecraft:granite" });
            expect(recipe.ingredients[1]).toEqual({ item: "minecraft:sand" });
            expect(recipe.result).toEqual({
                item: "minecraft:red_sand",
                count: 1
            });
        });

        it('can generate a crafting recipe that uses multiple different items in a list', () => {
            const rule = CraftingRule.parse('crafting 4 soil requires 3 dirt, 2 gravel, a grass, 2 stone, and 1 sand');
            const recipe = rule.getCraftingRecipe();

            expect(recipe.type).toEqual('minecraft:crafting_shapeless');
            expect(recipe.ingredients).toBeInstanceOf(Array);
            expect(recipe.ingredients).toHaveSize(9);
            expect(recipe.ingredients[0]).toEqual({ item: "minecraft:dirt" });
            expect(recipe.ingredients[1]).toEqual({ item: "minecraft:dirt" });
            expect(recipe.ingredients[2]).toEqual({ item: "minecraft:dirt" });
            expect(recipe.ingredients[3]).toEqual({ item: "minecraft:gravel" });
            expect(recipe.ingredients[4]).toEqual({ item: "minecraft:gravel" });
            expect(recipe.ingredients[5]).toEqual({ item: "minecraft:grass" });
            expect(recipe.ingredients[6]).toEqual({ item: "minecraft:stone" });
            expect(recipe.ingredients[7]).toEqual({ item: "minecraft:stone" });
            expect(recipe.ingredients[8]).toEqual({ item: "minecraft:sand" });
            expect(recipe.result).toEqual({
                item: "minecraft:soil",
                count: 4
            });
        });

        it('can generate a crafting recipe that uses multiple different items with specific quantities', () => {
            const rule = CraftingRule.parse('crafting a red_sand requires a granite and 2 sand');
            const recipe = rule.getCraftingRecipe();

            expect(recipe.type).toEqual('minecraft:crafting_shapeless');
            expect(recipe.ingredients).toBeInstanceOf(Array);
            expect(recipe.ingredients).toHaveSize(3);
            expect(recipe.ingredients[0]).toEqual({ item: "minecraft:granite" });
            expect(recipe.ingredients[1]).toEqual({ item: "minecraft:sand" });
            expect(recipe.ingredients[2]).toEqual({ item: "minecraft:sand" });
            expect(recipe.result).toEqual({
                item: "minecraft:red_sand",
                count: 1
            });
        });

        it('can generate crafting recipe that uses a tag for an input item', () => {
            const rule = CraftingRule.parse('crafting an oak_chest requires 4 #planks');
            const recipe = rule.getCraftingRecipe();

            expect(recipe.type).toEqual('minecraft:crafting_shapeless');
            expect(recipe.ingredients).toBeInstanceOf(Array);
            expect(recipe.ingredients).toHaveSize(4);
            expect(recipe.ingredients[0]).toEqual({ tag: 'minecraft:planks' });
            expect(recipe.ingredients[1]).toEqual({ tag: 'minecraft:planks' });
            expect(recipe.ingredients[2]).toEqual({ tag: 'minecraft:planks' });
            expect(recipe.ingredients[3]).toEqual({ tag: 'minecraft:planks' });

            expect(recipe.result).toEqual({
                item: 'minecraft:oak_chest',
                count: 1
            });
        });

        it('can generate crafting recipe that uses a tag for an input item that is namespaced', () => {
            const rule = CraftingRule.parse('crafting an oak_chest requires 4 #somemod:planks');
            const recipe = rule.getCraftingRecipe();

            expect(recipe.type).toEqual('minecraft:crafting_shapeless');
            expect(recipe.ingredients).toBeInstanceOf(Array);
            expect(recipe.ingredients).toHaveSize(4);
            expect(recipe.ingredients[0]).toEqual({ tag: 'somemod:planks' });
            expect(recipe.ingredients[1]).toEqual({ tag: 'somemod:planks' });
            expect(recipe.ingredients[2]).toEqual({ tag: 'somemod:planks' });
            expect(recipe.ingredients[3]).toEqual({ tag: 'somemod:planks' });

            expect(recipe.result).toEqual({
                item: 'minecraft:oak_chest',
                count: 1
            });
        });

        describe('incorrectly formed', () => {
            it('throws parsing exception when expecting an item or tag', () => {
                const rule = 'crafting sand requires a 2';
                expect(() => CraftingRule.parse(rule)).toThrowMatching((err) => err.message == 'invalid syntax: expected an item or namespaced item reference, but instead was: 2');
            });

            it('throws parsing exception for attempting to use a tag as the output item in a crafting recipe', () => {
                const rule = 'crafting #planks requires 4 boards';
                expect(() => CraftingRule.parse(rule)).toThrowMatching((err) => err.message == 'invalid recipe: cannot use a tag as the output item of a recipe.');
            });

            it('throws parsing exception for attempting to use more than 9 items in the recipe', () => {
                const rule = 'crafting a soil requires 3 sand, 2 gravel, a grass, 2 stone, and 2 dirt';
                expect(() => CraftingRule.parse(rule)).toThrowMatching((err) => err.message == 'invalid recipe: total number of items in a recipe cannot exceed 9.');
            });

            it('throws parsing exception for attempting to provide no ingredient items in the recipe', () => {
                const rule = 'crafting a soil requires';
                expect(() => CraftingRule.parse(rule)).toThrowMatching((err) => err.message == 'invalid recipe: at least one item must be used in the recipe.');
            });

            it('throws parsing exception for attempting to provide ingredient of quantity less than 1', () => {
                const rule1 = 'crafting a soil requires 0 dirt';
                expect(() => CraftingRule.parse(rule1)).toThrowMatching((err) => err.message == 'invalid recipe: if the quantity of an ingredient is supplied, it needs to be 1 or more.');

                const rule2 = 'crafting a soil requires -2 dirt';
                expect(() => CraftingRule.parse(rule2)).toThrowMatching((err) => err.message == 'invalid recipe: if the quantity of an ingredient is supplied, it needs to be 1 or more.');
            });
        });
    });

    describe('for shaped recipes', () => {
        it('can generate simple shaped crafting recipe', () => {
            const rule = CraftingRule.parse("crafting diamond_horse_armor requires #wool W, diamond d shaped [ dd], [dWd], [ddd]");
            const recipe = rule.getCraftingRecipe();

            expect(recipe.type).toEqual('minecraft:crafting_shaped');
            expect(recipe.key).toBeInstanceOf(Object);
            expect(recipe.key).toContainKey('d');
            expect(recipe.key['d']).toEqual({
                item: 'minecraft:diamond'
            });
            expect(recipe.key).toContainKey('W');
            expect(recipe.key['W']).toEqual({
                tag: 'minecraft:wool'
            });

            expect(recipe.pattern).toBeInstanceOf(Array);
            expect(recipe.pattern).toEqual([' dd', 'dWd', 'ddd']);

            expect(recipe.result).toEqual({
                item: 'minecraft:diamond_horse_armor',
                count: 1
            });
        });

        it('can generate crafting recipe that specifies a category', () => {
            const rule = CraftingRule.parse("crafting diamond_horse_armor requires #wool W, diamond d shaped [ dd], [dWd], [ddd] and is categorized as equipment");
            const recipe = rule.getCraftingRecipe();

            expect(recipe).toContainKey('category');
            expect(recipe['category']).toEqual('equipment');
        });

        it('can generate crafting recipe that shows notification', () => {
            const rule = CraftingRule.parse("crafting diamond_horse_armor requires #wool W, diamond d shaped [ dd], [dWd], [ddd] and shows notification");
            const recipe = rule.getCraftingRecipe();

            expect(recipe).toContainKey('show_notification');
            expect(recipe['show_notification']).toEqual(true);
        });

        it('can generate crafting recipe from multi-line input', () => {
            const rule = CraftingRule.parse(`crafting 4 arrow
                                            requires
                                                iron_nugget ^,
                                                stick |,
                                                feather X
                                            shaped
                                                [^],
                                                [|],
                                                [X]
                                            and is categorized as equipment
                                            and shows notification`);
            const recipe = rule.getCraftingRecipe();

            expect(recipe.type).toEqual('minecraft:crafting_shaped');
            expect(recipe.result).toEqual({ item: 'minecraft:arrow', count: 4 });

            expect(recipe.key).toBeInstanceOf(Object);
            expect(recipe.key).toContainKey('^');
            expect(recipe.key['^']).toEqual({
                item: 'minecraft:iron_nugget'
            });
            expect(recipe.key).toContainKey('|');
            expect(recipe.key['|']).toEqual({
                item: 'minecraft:stick'
            });
            expect(recipe.key).toContainKey('X');
            expect(recipe.key['X']).toEqual({
                item: 'minecraft:feather'
            });

            expect(recipe.pattern).toBeInstanceOf(Array);
            expect(recipe.pattern).toEqual(['^', '|', 'X']);

            expect(recipe.category).toEqual('equipment');
            expect(recipe.show_notification).toEqual(true);
        });
    });
});