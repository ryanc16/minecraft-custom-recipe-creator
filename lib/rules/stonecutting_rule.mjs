import { default as moo } from 'moo';
import { StonecuttingRecipeBuilder } from "../recipes.mjs";
import { Item } from '../items/item.mjs';
import { ParsingException } from './exceptions.mjs';
import mcData from 'minecraft-data';

export class StonecuttingRule {

    constructor(action, inputItem, outputItem, outputItemCount) {
        this.action = action;
        this.inputItem = inputItem;
        this.outputItem = outputItem;
        this.outputItemCount = outputItemCount;
    }

    /**
     * @param {string} rule
     * @param {object} options
     */
    static parse(rule, options) {
        const parsed = {
            action: '',
            inputItem: null,
            outputItem: null,
            outputCount: null
        };
        const lexer = moo.compile({
            item_ref: /\b\w+\:\w+\b/,
            tag_ref: /#\b(?:\w+\:)?\w+\b/,
            action: 'stonecutting',
            result_effect: 'produces',
            input_quantifier: ['of', 'a', 'an'],
            decimal: { match: /\-?\b\d+?\.\d+\b/, value: v => parseFloat(v) },
            int: { match: /\-?\b\d+\b/, value: v => parseInt(v) },
            str_literal: /\b\w+\b/,
            // {
            //     match: /\b\w+\b/,
            //     type: moo.keywords({
            //         actions: ['stonecutting'],
            //         result_effect: ['produces'],
            //     }),
            // },
            whitespace: { match: /[\s\t]+/, lineBreaks: true },
            list_separator: /,/
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
        const getAction = () => {
            if (token?.type === 'action') {
                parsed.action = token.value;
            }
            nextWord();
        };
        const getInputItem = () => {
            while (['str_literal', 'item_ref', 'tag_ref', 'input_quantifier'].includes(token?.type)) {
                if (token?.type === 'input_quantifier') {
                    nextWord();
                    continue;
                } else if (['item_ref', 'str_literal', 'tag_ref'].includes(token?.type)) {
                    parsed.inputItem = new Item(token.value);
                    nextWord();
                }
                if (token?.type === 'list_separator') {
                    throw new ParsingException('invalid syntax: stonecutting recipes do not allow multiple input ingredients.');
                }
            }
        };
        const getResultEffect = () => {
            if (token.value === 'produces') {
                nextWord();
                if (token.type !== 'int') {
                    throw new ParsingException('invalid syntax: the produced item quantity must be an integer');
                }
                const count = readInt();
                nextWord();
                if (!['item_ref', 'str_literal'].includes(token?.type)) {
                    throw new ParsingException('invalid syntax: the produced item must be provided');
                }
                const item = token.value;
                parsed.outputItem = new Item(item);
                parsed.outputCount = count;
            }
            nextWord();
        };
        while (token != null) {
            if (token?.type === 'action') {
                getAction();
                getInputItem();
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
        const compiledRule = new StonecuttingRule(parsed.action, parsed.inputItem, parsed.outputItem, parsed.outputCount);
        if (options && options.validate && options.validate.version) {
            const mcDataForVersion = mcData(options.validate.version);
            if (mcDataForVersion) {
                if (!parsed.inputItem.isTag() && parsed.inputItem.getNamespace() === 'minecraft' && !(parsed.inputItem.getName() in mcDataForVersion.itemsByName)) {
                    throw new Error('validation: item "' + parsed.inputItem.getName() + '" does not exist in minecraft version ' + options.validate.version + '. If it comes from a mod, it needs to be prefixed with its namespace!');
                }
                if (!parsed.inputItem.isTag() && parsed.outputItem.getNamespace() === 'minecraft' && !(parsed.outputItem.getName() in mcDataForVersion.itemsByName)) {
                    throw new Error('validation: item "' + parsed.outputItem.getName() + '" does not exist in minecraft version ' + options.validate.version + '. If it comes from a mod, it needs to be prefixed with its namespace!');
                }
            } else {
                throw new Error('validation: requested validation on rule parsing, but item data for provided minecraft version ' + options.validate.version + ' could not be found!');
            }
        }
        return compiledRule;
    }

    getType() {
        return 'stonecutting';
    }

    getAction() {
        return this.action;
    }

    getInputItem() {
        return this.inputItem;
    }

    getOutput() {
        return { item: this.outputItem, count: this.outputItemCount };
    }

    getStonecuttingRecipe() {
        const builder = StonecuttingRecipeBuilder.create().ingredient(this.getInputItem()).result(this.getOutput());
        return builder.build();
    }

    hasMultiple() {
        return false;
    }

    getRecipe() {
        return this.getStonecuttingRecipe();
    }

    generateName() {
        const inputName = this.getInputItem().getName();
        const outputName = this.getOutput().item.getName();
        return 'stonecutting_' + outputName + '_from_' + inputName;
    }
}