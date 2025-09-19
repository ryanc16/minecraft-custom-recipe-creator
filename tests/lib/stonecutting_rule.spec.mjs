import { StonecuttingRule } from "../../lib/rules/stonecutting_rule.mjs";

describe('StonecuttingRule', () => {

    it('can generate a simple stonecutting recipe', () => {
        const rule = StonecuttingRule.parse("stonecutting glass produces 6 glass_pane");
        const recipe = rule.getStonecuttingRecipe();

        expect(recipe.type).toEqual("minecraft:stonecutting");
        expect(recipe.ingredient).toEqual({ item: "minecraft:glass" });
        expect(recipe.result).toEqual("minecraft:glass_pane");
        expect(recipe.count).toEqual(6);
    });

    it('can generate a recipe that uses a tag for the input item', () => {
        const rule1 = StonecuttingRule.parse("stonecutting a #glass produces 6 glass_pane");
        const recipe1 = rule1.getStonecuttingRecipe();

        expect(recipe1.type).toEqual("minecraft:stonecutting");
        expect(recipe1.ingredient).toEqual({ tag: "minecraft:glass" });
        expect(recipe1.result).toEqual("minecraft:glass_pane");
        expect(recipe1.count).toEqual(6);

        const rule2 = StonecuttingRule.parse("stonecutting a #minecraft:glass produces 6 glass_pane");
        const recipe2 = rule2.getStonecuttingRecipe();

        expect(recipe2.type).toEqual("minecraft:stonecutting");
        expect(recipe2.ingredient).toEqual({ tag: "minecraft:glass" });
        expect(recipe2.result).toEqual("minecraft:glass_pane");
        expect(recipe2.count).toEqual(6);
    });

    it('can generate a recipe that uses quantifiers on the input', () => {
        const rule1 = StonecuttingRule.parse("stonecutting a glass produces 6 glass_pane");
        const recipe1 = rule1.getStonecuttingRecipe();

        expect(recipe1.type).toEqual("minecraft:stonecutting");
        expect(recipe1.ingredient).toEqual({ item: "minecraft:glass" });
        expect(recipe1.result).toEqual("minecraft:glass_pane");
        expect(recipe1.count).toEqual(6);

        const rule2 = StonecuttingRule.parse("stonecutting an ice_block produces 12 ice_cubes");
        const recipe2 = rule2.getStonecuttingRecipe();

        expect(recipe2.type).toEqual("minecraft:stonecutting");
        expect(recipe2.ingredient).toEqual({ item: "minecraft:ice_block" });
        expect(recipe2.result).toEqual("minecraft:ice_cubes");
        expect(recipe2.count).toEqual(12);
    });

    describe('incorrectly formed', () => {
        it('throws parsing exception when attempting to list multiple input ingredients', () => {
            const rule = 'stonecutting ice, packed_ice produces 12 ice_cubes';
            expect(() => StonecuttingRule.parse(rule)).toThrowMatching((err) => err.message === 'invalid syntax: stonecutting recipes do not allow multiple input ingredients.');
        });
    });
});