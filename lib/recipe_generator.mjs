import * as path from 'node:path';
import * as fs from 'node:fs';
import * as fsPromise from 'node:fs/promises';
import { CraftingRule } from './rules/crafting_rule.mjs';
import { StonecuttingRule } from './rules/stonecutting_rule.mjs';
import { SmeltingRule } from './rules/smelting_rule.mjs';

export default class RecipeGenerator {
    /**
     *
     * @param {string|path} baseDir
     * @param {string} packageName
     * @param {{validate?: {version: string}}?} options
     */
    constructor(baseDir, packageName, options) {
        this._outDir = path.join(baseDir, packageName, 'recipes');
        this._options = options ?? {};
    }

    init() {
        fs.mkdirSync(this._outDir, { recursive: true });
    }

    async processRules(rules, options) {
        const vars = options?.variables ?? {};
        const ruleGroup = {
            crafting: [],
            smelting: [],
            stonecutting: []
        };
        for (const rule of rules) {
            let processedRule = rule;
            const interpolations = rule.match(/\$\{([^\}]*)\}/g);
            if (interpolations) {
                for (const int of interpolations) {
                    let expr = int.slice(2).slice(0, -1);
                    Object.entries(vars).forEach(([key, value]) => {
                        expr = expr.replace(key, value);
                    });
                    const result = eval(expr);
                    processedRule = processedRule.replace(int, result);
                }
            }

            if (processedRule.trim().startsWith('crafting')) {
                ruleGroup.crafting.push(processedRule);
            } else if (processedRule.trim().startsWith('smelting') || processedRule.trim().startsWith('blasting')) {
                ruleGroup.smelting.push(processedRule);
            } else if (processedRule.trim().startsWith('stonecutting')) {
                ruleGroup.stonecutting.push(processedRule);
            }
        }
        return this.generateRecipes(ruleGroup);
    }

    async generateRecipes(rules) {
        return new Promise((resolve, reject) => {
            this.init();
            const parsingOptions = {};
            if (this._options && this._options.validate) {
                if (this._options.validate.version) {
                    parsingOptions.validate = {
                        version: this._options.validate.version
                    };
                }
            }
            const tasks = [];
            if ('crafting' in rules && Array.isArray(rules.crafting)) {
                for (const craftingRule of rules.crafting) {
                    const parsedRule = CraftingRule.parse(craftingRule, parsingOptions);
                    if (parsedRule instanceof CraftingRule) {
                        const recipeName = parsedRule.generateName();
                        const recipe = parsedRule.getCraftingRecipe();
                        tasks.push(this.writeRecipe(recipeName, recipe));
                    }
                }
            }
            if ('smelting' in rules && Array.isArray(rules.smelting)) {
                tasks.push(...this.#_smeltOrBlast(rules.smelting, parsingOptions));
            }
            if ('blasting' in rules && Array.isArray(rules.blasting)) {
                tasks.push(...this.#_smeltOrBlast(rules.blasting, parsingOptions));
            }
            if ('stonecutting' in rules && Array.isArray(rules.stonecutting)) {
                for (const stonecuttingRule of rules.stonecutting) {
                    const parsedRule = StonecuttingRule.parse(stonecuttingRule, parsingOptions);
                    if (parsedRule instanceof StonecuttingRule) {
                        const recipeName = parsedRule.generateName();
                        const recipe = parsedRule.getStonecuttingRecipe();
                        tasks.push(this.writeRecipe(recipeName, recipe));
                    }
                }
            }
            return Promise.all(tasks).then(resolve).catch(reject);
        });
    }

    #_smeltOrBlast(rules, parsingOptions) {
        const tasks = [];
        for (const rule of rules) {
            const parsedRule = SmeltingRule.parse(rule, parsingOptions);
            if (parsedRule instanceof SmeltingRule) {
                if (parsedRule.canBeSmelted()) {
                    const smeltingRecipeName = parsedRule.generateSmeltingRecipeName();
                    const smeltingRecipe = parsedRule.getSmeltingRecipe();
                    tasks.push(this.writeRecipe(smeltingRecipeName, smeltingRecipe));
                }
                if (parsedRule.canBeBlasted()) {
                    const blastingRecipeName = parsedRule.generateBlastingRecipeName();
                    const blastingRecipe = parsedRule.getBlastingRecipe();
                    tasks.push(this.writeRecipe(blastingRecipeName, blastingRecipe));
                }
            }
        }
        return tasks;
    }

    async writeRecipe(recipeName, recipe) {
        const recipeFile = path.join(this._outDir, recipeName + '.json');
        return fsPromise.writeFile(recipeFile, JSON.stringify(recipe))
            .then(() => console.info('wrote: %s', recipeFile));
    }

}
