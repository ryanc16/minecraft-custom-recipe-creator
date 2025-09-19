import { default as moo } from 'moo';
import { BlastingRecipeBuilder, SmeltingRecipeBuilder } from "../recipes.mjs";
import { Item } from '../items/item.mjs';
import { ParsingException } from './exceptions.mjs';
import mcData from 'minecraft-data';

export class SmeltingRule {

    static DEFAULT_SMELTING_TICKS_PER_ITEM = 200;
    static DEFAULT_BLASTING_TICKS_PER_ITEM = 100;

    constructor(actions, inputItems, outputItem, outputItemCount, cookingTime, experience) {
        this.actions = actions;
        this.inputItems = inputItems;
        this.outputItem = outputItem;
        this.outputItemCount = outputItemCount;
        this.cookingTime = cookingTime;
        this.experience = experience;
    }

    /**
     * @param {string} rule
     * @param {object} options
     */
    static parse(rule, options) {
        const parsed = {
            actions: [],
            experience: null,
            cookingtime: null,
            inputItems: [],
            outputItem: null,
            outputCount: null
        };
        const lexer = moo.compile({
            item_ref: /\b\w+\:\w+\b/,
            decimal: { match: /\d+?\.\d+/, value: v => parseFloat(v) },
            int: { match: /\b\d+\b/, value: v => parseInt(v) },
            whitespace: { match: /[\s\t]+/, lineBreaks: true },
            list_separator: /,/,
            str_literal: {
                match: /\b\w+\b/,
                type: moo.keywords({
                    actions: ['smelting', 'blasting'],
                    result_effect: ['produces', 'grants', 'takes'],
                    result_effect_aggregator: ['and'],
                    actions_aggregator: ['or'],
                    input_quantifier: ['of', 'a', 'an'],
                }),
            },
        });
        lexer.reset(rule);
        let token = lexer.next();
        const nextWord = () => {
            token = lexer.next();
            while (token?.type === 'whitespace') {
                token = lexer.next();
            }
        };
        const readInt = () => {
            let value = '';
            while (token?.type === 'int') {
                value += token.value;
                token = lexer.next();
            }
            return parseInt(value);
        };
        const readFloat = () => {
            if (!['int', 'decimal'].includes(token?.type)) {
                throw new ParsingException('invalid syntax: expected numeric value. instead got: ' + token.value);
            }
            return parseFloat(token.value);
        };
        const getItem = () => {
            if (['item_ref', 'str_literal'].includes(token?.type)) {
                return new Item(token.value);
            } else {
                throw new ParsingException('invalid syntax: expected an item or namespaced items reference, but instead was: ' + token.value);
            }
        };
        const getAllActions = () => {
            while (['actions', 'actions_aggregator'].includes(token?.type)) {
                if (token?.type === 'actions') {
                    parsed.actions.push(token.value);
                }
                nextWord();
            }
        };
        const getAllInputItems = () => {
            if (token?.type === 'input_quantifier') {
                if (token.value === 'of') {
                    nextWord();
                    while (['item_ref', 'list_separator', 'str_literal'].includes(token?.type)) {
                        if (token.type === 'item_ref' || token.type === 'str_literal') {
                            const item = getItem();
                            parsed.inputItems.push(item);
                        }
                        nextWord();
                    }
                } else if (['a', 'an'].includes(token.value)) {
                    nextWord();
                    const item = getItem();
                    parsed.inputItems.push(item);
                    nextWord();
                }
            } else {
                throw new ParsingException('invalid syntax: one or more input items must be provided following of, a, an.');
            }
        };
        const getResultEffect = () => {
            if (token?.value === 'produces') {
                nextWord();
                if (token.type !== 'int') {
                    throw new ParsingException('invalid syntax: the produced item quantity must be an integer');
                }
                const count = readInt();
                nextWord();
                if (!['item_ref', 'str_literal'].includes(token?.type)) {
                    throw new ParsingException('invalid syntax: the produced item must be provided');
                }
                const item = getItem();
                parsed.outputItem = item;
                parsed.outputCount = count;
            } else if (token?.value === 'grants') {
                nextWord();
                if (!['int', 'decimal'].includes(token.type)) {
                    throw new ParsingException('invalid syntax: provided quantity to "grants" must be a numeric value.');
                }
                const howMuch = readFloat();
                nextWord();
                const grantsWhat = token.value;
                if (grantsWhat === 'experience') {
                    parsed.experience = howMuch;
                } else {
                    // TODO
                }
            } else if (token?.value === 'takes') {
                nextWord();
                if (token.type !== 'int') {
                    throw new ParsingException('invalid syntax: provided quantity to "takes" must be a whole number value.');
                }

                const howMany = readInt();
                nextWord();
                const takesWhat = token.value;
                if (takesWhat === 'ticks') {
                    parsed.cookingtime = howMany;
                } else {
                    // TODO
                }
            }
            nextWord();
        };
        while (token != null) {
            if (token?.type === 'actions') {
                getAllActions();
                getAllInputItems();
                if (token?.type === 'result_effect') {
                    getResultEffect();
                    while (token?.type === 'result_effect_aggregator') {
                        nextWord();
                        getResultEffect();
                    }
                }
            } else {
                // TODO
            }
            nextWord();
        }

        const compiledRule = new SmeltingRule(parsed.actions, parsed.inputItems, parsed.outputItem, parsed.outputCount, parsed.cookingtime, parsed.experience);
        if (options && options.validate && options.validate.version) {
            const mcDataForVersion = mcData(options.validate.version);
            if (mcDataForVersion) {
                for (const item of parsed.inputItems) {
                    if (!item.isTag() && item.getNamespace() === 'minecraft' && !(item.getName() in mcDataForVersion.itemsByName)) {
                        throw new Error('validation: item "' + item.getName() + '" does not exist in minecraft version ' + options.validate.version + '. If it comes from a mod, it needs to be prefixed with its namespace!');
                    }
                }
                if (!parsed.outputItem.isTag() && parsed.outputItem.getNamespace() === 'minecraft' && !(parsed.outputItem.getName() in mcDataForVersion.itemsByName)) {
                    throw new Error('validation: item "' + parsed.outputItem.getName() + '" does not exist in minecraft version ' + options.validate.version + '. If it comes from a mod, it needs to be prefixed with its namespace!');
                }
            } else {
                throw new Error('validation: requested validation on rule parsing, but item data for provided minecraft version ' + options.validate.version + ' could not be found!');
            }
        }
        return compiledRule;
    }

    getType() {
        return 'smelting';
    }

    getActions() {
        return this.actions;
    }

    getInputItems() {
        return this.inputItems;
    }

    getOutput() {
        return { item: this.outputItem, count: this.outputItemCount };
    }

    getCookingTime() {
        return this.cookingTime;
    }

    getExperienceGranted() {
        return this.experience;
    }

    canBeSmelted() {
        return this.actions.includes('smelting');
    }

    canBeBlasted() {
        return this.actions.includes('blasting');
    }

    getSmeltingRecipe() {
        const builder = SmeltingRecipeBuilder.create().ingredients(this.getInputItems()).result(this.getOutput());
        if (this.cookingTime != null) {
            builder.cookingTime(this.cookingTime);
        }
        if (this.experience != null) {
            builder.experience(this.experience);
        }
        return builder.build();
    }

    getBlastingRecipe() {
        const builder = BlastingRecipeBuilder.create().ingredients(this.getInputItems()).result(this.getOutput());
        if (this.cookingTime != null) {
            builder.cookingTime(this.cookingTime);
        }
        if (this.experience != null) {
            builder.experience(this.experience);
        }
        return builder.build();
    }

    hasMultiple() {
        return this.canBeSmelted() && this.canBeBlasted();
    }

    generateSmeltingRecipeName() {
        const inputItem = this.getInputItems()[0].getName();
        const outputItem = this.getOutput().item.getName();

        return 'smelting_' + outputItem + '_from_' + inputItem;
    }

    generateBlastingRecipeName() {
        const inputItem = this.getInputItems()[0].getName();
        const outputItem = this.getOutput().item.getName();

        return 'blasting_' + outputItem + '_from_' + inputItem;
    }

    getRecipe() {
        const recipes = {};
        if (this.canBeSmelted()) {
            recipes['smelting'] = this.getSmeltingRecipe();
        }
        if (this.canBeBlasted()) {
            recipes['blasting'] = this.getBlastingRecipe();
        }
        if (Object.keys(recipes).length == 1) {
            return recipes[Object.keys(recipes).pop()];
        } else {
            return recipes;
        }
    }
}