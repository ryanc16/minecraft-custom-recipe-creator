import { default as moo } from 'moo';
import { Item } from "../items/item.mjs";
import { ParsingException } from "./exceptions.mjs";
import mcData from 'minecraft-data';

export class CraftingRule {

    constructor(shapeless, inputItems, outputItem, outputItemCount, category, notifies) {
        this.shapeless = shapeless;
        this.inputItems = inputItems;
        this.outputItem = outputItem;
        this.outputItemCount = outputItemCount;
        // optional
        this.category = category;
        this.notifies = notifies;
    }

    /**
     *
     * @param {string} rule
     * @returns
     */
    static parse(rule, options) {
        let parsed;
        if (rule.match(/\bshaped\b/)) {
            parsed = CraftingRule.#_parseShaped(rule);
        } else {
            parsed = CraftingRule.#_parseShapeless(rule);
        }

        const compiledRule = new CraftingRule(parsed.shapeless, parsed.inputItems, parsed.outputItem, parsed.outputItemCount, parsed.category, parsed.notifies);
        if (options && options.validate && options.validate.version) {
            const mcDataForVersion = mcData(options.validate.version);
            if (mcDataForVersion) {
                if (parsed.shapeless) {
                    for (const item of parsed.inputItems) {
                        if (!item.isTag() && item.getNamespace() === 'minecraft' && !(item.getName() in mcDataForVersion.itemsByName)) {
                            throw new Error('validation: item "' + item.getName() + '" does not exist in minecraft version ' + options.validate.version + '. If it comes from a mod, it needs to be prefixed with its namespace!');
                        }
                    }
                } else {
                    for (const item of Object.values(parsed.inputItems.key)) {
                        if (!item.isTag() && item.getNamespace() === 'minecraft' && !(item.getName() in mcDataForVersion.itemsByName)) {
                            throw new Error('validation: item "' + item.getName() + '" does not exist in minecraft version ' + options.validate.version + '. If it comes from a mod, it needs to be prefixed with its namespace!');
                        }
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

    static #_parseShapeless(rule) {
        const parsed = {
            action: '',
            category: '',
            notifies: false,
            shapeless: true,
            inputItems: [],
            outputItem: null,
            outputItemCount: 1
        };

        const lexer = moo.compile({
            item_ref: /\b\w+\:\w+\b/,
            tag_ref: /#\b(?:\w+\:)?\w+\b/,
            action: 'crafting',
            recipe: 'requires',
            category: 'and is categorized as',
            notifies: 'and shows notification',
            // KW: {
            //     match: /\b[a-zA-Z]+\b/,
            //     type: moo.keywords({
            //         action: 'crafting',
            //         recipe: 'requires',
            //     })
            // },
            decimal: { match: /\-?\b\d+?\.\d+\b/, value: v => parseFloat(v) },
            int: { match: /\-?\b\d+\b/, value: v => parseInt(v) },
            str_literal: {
                match: /\b\w+\b/,
                type: moo.keywords({
                    aggregator: ['and'],
                    quantifier: ['of', 'a', 'an'],
                }),
            },
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
            if (['item_ref', 'tag_ref', 'str_literal'].includes(token?.type)) {
                return new Item(token.value);
            } else {
                throw new ParsingException('invalid syntax: expected an item or namespaced item reference, but instead was: ' + token.value);
            }
        };
        const getAllActions = () => {
            while (['action', 'actions_aggregator'].includes(token?.type)) {
                if (token?.type === 'action') {
                    parsed.action = token.value;
                }
                nextWord();
            }
        };

        const getOutputItemAndQuantity = () => {
            while (token?.type === 'int' || ['str_literal', 'item_ref', 'tag_ref', 'quantifier'].includes(token?.type)) {
                if (token?.type === 'int') {
                    parsed.outputItemCount = readInt();
                } else if (token?.type === 'quantifier') {
                    if (['a', 'an'].includes(token.value)) {
                        parsed.outputItemCount = 1;
                    }
                } else if (['str_literal', 'item_ref'].includes(token?.type)) {
                    parsed.outputItem = new Item(token.value);
                } else if (token?.type === 'tag_ref') {
                    throw new ParsingException('invalid recipe: cannot use a tag as the output item of a recipe.');
                }
                nextWord();
            }
        };

        const getRequiredRecipeIngredients = () => {
            let ingredientCount = 0;
            while (['str_literal', 'item_ref', 'tag_ref', 'int', 'quantifier'].includes(token?.type)) {
                let count = 1;
                let item = null;
                if (token?.type === 'quantifier') {
                    count = 1;
                    nextWord();
                } else if (token?.type === 'int') {
                    count = readInt();
                    nextWord();
                }
                if (count >= 1 === false) {
                    throw new ParsingException('invalid recipe: if the quantity of an ingredient is supplied, it needs to be 1 or more.');
                }
                // if (['str_literal', 'item_ref', 'tag_ref'].includes(token?.type)) {
                // }
                item = getItem();
                if (item != null && count > 0) {
                    ingredientCount += count;
                    if (ingredientCount > 9) {
                        throw new ParsingException('invalid recipe: total number of items in a recipe cannot exceed 9.');
                    }
                    for (let i = 0; i < count; i++) {
                        parsed.inputItems.push(item);
                    }
                }
                nextWord();
                while (['aggregator', 'list_separator'].includes(token?.type)) {
                    nextWord();
                }
            }
            if (ingredientCount > 0 === false) {
                throw new ParsingException("invalid recipe: at least one item must be used in the recipe.");
            }
        };

        const getRecipeCategory = () => {
            nextWord();
            parsed.category = token.value;
        };

        while (token != null) {
            if (token?.type === 'action') {
                getAllActions();
                getOutputItemAndQuantity();
                if (token?.type === 'recipe') {
                    nextWord();
                    getRequiredRecipeIngredients();
                    // while (token?.type === 'result_effect_aggregator') {
                    //     nextWord();
                    //     getResultEffect();
                    // }
                }
            } else if (token?.type === 'category') {
                getRecipeCategory();
            } else if (token?.type === 'notifies') {
                parsed.notifies = true;
            } else {
                // TODO
            }
            nextWord();
        }

        return parsed;
    }

    static #_parseShaped(rule) {
        const parsed = {
            action: '',
            shapeless: false,
            category: '',
            notifies: false,
            inputItems: {
                key: {},
                pattern: []
            },
            outputItem: null,
            outputItemCount: 1
        };

        const lexer = moo.compile({
            item_ref: /\b\w+\:\w+\b/,
            tag_ref: /#\b(?:\w+\:)?\w+\b/,
            action: 'crafting',
            recipe: /\brequires\b/,
            template_values: /\bfor\b/,
            shape_definition: /\bshaped\b/,
            shape_row_boundary: ['[', ']'],
            category: 'and is categorized as',
            notifies: 'and shows notification',
            // KW: {
            //     match: /\b[a-zA-Z]+\b/,
            //     type: moo.keywords({
            //         action: 'crafting',
            //         recipe: 'requires',
            //     })
            // },
            decimal: { match: /\-?\b\d+?\.\d+\b/, value: v => parseFloat(v) },
            int: { match: /\-?\b\d+\b/, value: v => parseInt(v) },
            str_literal: {
                match: /\b\w+\b/,
                type: moo.keywords({
                    aggregator: ['and'],
                    quantifier: ['of', 'a', 'an'],
                }),
            },
            whitespace: { match: /[\s\t]+/, lineBreaks: true },
            symbol: ['!', '@', '$', '%', '^', '&', '*', '(', ')', '|', '<', '>', '?', '/', '\\', '~', '`', '+', '=', '{', '}', ';', '"', "'"],
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
            if (['item_ref', 'tag_ref', 'str_literal'].includes(token?.type)) {
                return new Item(token.value);
            } else {
                throw new ParsingException('invalid syntax: expected an item or namespaced item reference, but instead was: ' + token.value);
            }
        };
        const getAllActions = () => {
            while (['action', 'actions_aggregator'].includes(token?.type)) {
                if (token?.type === 'action') {
                    parsed.action = token.value;
                }
                nextWord();
            }
        };

        const getOutputItemAndQuantity = () => {
            while (token?.type === 'int' || ['str_literal', 'item_ref', 'tag_ref', 'quantifier'].includes(token?.type)) {
                if (token?.type === 'int') {
                    parsed.outputItemCount = readInt();
                } else if (token?.type === 'quantifier') {
                    if (['a', 'an'].includes(token.value)) {
                        parsed.outputItemCount = 1;
                    }
                } else if (['str_literal', 'item_ref'].includes(token?.type)) {
                    parsed.outputItem = new Item(token.value);
                } else if (token?.type === 'tag_ref') {
                    throw new ParsingException('invalid recipe: cannot use a tag as the output item of a recipe.');
                }
                nextWord();
            }
        };

        const getRequiredRecipeIngredients = () => {
            let ingredientCount = 0;
            while (['str_literal', 'symbol', 'item_ref', 'tag_ref'].includes(token?.type)) {
                // if (['str_literal', 'item_ref', 'tag_ref'].includes(token?.type)) {
                // }
                const item = getItem();
                nextWord();
                if (!['str_literal', 'symbol'].includes(token?.type)) {
                    throw new ParsingException('invalid syntax: an item identifier must be provided.');
                } else if (token.value.length > 1) {
                    throw new ParsingException('invalid syntax: and item identifier must be a single character.');
                }
                const identifier = token.value;

                if (item != null && identifier != null) {
                    ingredientCount += 1;
                    if (ingredientCount > 9) {
                        throw new ParsingException('invalid recipe: a shaped recipe cannot use more than 9 different ingredients.');
                    }
                    parsed.inputItems.key[identifier] = item;
                }
                nextWord();
                while (['aggregator', 'list_separator'].includes(token?.type)) {
                    nextWord();
                }
            }
            if (ingredientCount > 0 === false) {
                throw new ParsingException("invalid recipe: at least one item must be used in the recipe.");
            }
        };

        const getShapeDefinition = () => {
            if (token?.type === 'shape_definition') {
                nextWord();
            }
            let shape = [];
            let row = null;
            while (['whitespace', 'str_literal', 'symbol', 'list_separator', 'shape_row_boundary'].includes(token?.type)) {
                let done = false;
                if (token.value === '[' && row == null) {
                    row = [];
                } else if (token.value === ']' && row != null) {
                    shape.push(row);
                    row = null;
                } else if (['whitespace', 'str_literal', 'symbol'].includes(token.type) && row != null) {
                    do {
                        if (token.value.length > 1) {
                            const ids = token.value.split('');
                            for (const id of ids) {
                                if (token.type !== 'whitespace' && !(id in parsed.inputItems.key)) {
                                    throw new ParsingException('invalid shape: recipe shape must only use ingredient identifiers that have already been declared.');
                                }
                                row.push(id);
                            }
                            // throw new ParsingException('invalid syntax: recipe shape must use a single character identifier for the ingredient.');
                        } else {
                            row.push(token.value);
                        }
                        token = lexer.next();
                    } while (['whitespace', 'str_literal', 'symbol'].includes(token?.type));
                    // TODO: add parsing exception that makes sure each row is at least as wide as the widest row. Some recipes wont work if a row is shorter.
                    // Also note, recipes don't require all 3 row groups. for crafting in a 2x2 only 2 bracket groups are required. If its a 3x1 recipe, only a
                    // single set of brackets can be used to denote it can be any location 3x1 fits.
                    if (row.length > 3) {
                        throw new ParsingException('invalid shape: recipe shape must use single character identifiers for the ingredients.');
                    }
                    done = true;
                }
                if (!done) {
                    token = lexer.next();
                }
                if (token?.type === 'list_separator') {
                    nextWord();
                }
            };
            parsed.inputItems.pattern = shape;
        };

        const getRecipeCategory = () => {
            if (token?.type === 'category') {
                nextWord();
                parsed.category = token.value;
            }
        };

        while (token != null) {
            if (token?.type === 'action') {
                getAllActions();
                getOutputItemAndQuantity();
                if (token?.type === 'recipe') {
                    nextWord();
                    getRequiredRecipeIngredients();
                    if (token?.type === 'shape_definition') {
                        getShapeDefinition();
                    }
                    // while (token?.type === 'result_effect_aggregator') {
                    //     nextWord();
                    //     getResultEffect();
                    // }
                }
            } else if (token?.type === 'category') {
                getRecipeCategory();
                nextWord();
            } else if (token?.type === 'notifies') {
                parsed.notifies = true;
                nextWord();
            } else {
                nextWord();
            }

        }

        return parsed;
    }

    getType() {
        return 'crafting';
    }

    isShapeless() {
        return this.shapeless;
    }

    getInputItems() {
        return this.inputItems;
    }

    getOutput() {
        return { item: this.outputItem, count: this.outputItemCount };
    }

    getCategory() {
        return this.category;
    }

    isNotifying() {
        return this.notifies;
    }

    getCraftingRecipe() {
        if (this.shapeless) {
            const recipe = {
                "type": "minecraft:crafting_shapeless",
                "ingredients": this.inputItems.map(item => {
                    if (item.isTag()) {
                        return { tag: item.getResource() };
                    } else {
                        return { item: item.getResource() };
                    }
                }),
                "result": {
                    "item": this.outputItem.getResource(),
                    "count": this.outputItemCount
                }
            };
            if (this.category != null && this.category.length > 0) {
                recipe.category = this.category;
            }
            if (this.notifies != false) {
                recipe.show_notification = true;
            }
            return recipe;
        } else {
            const recipe = {
                "type": "minecraft:crafting_shaped",
                "pattern": this.inputItems.pattern.map(_items => _items.join('')),
                "key": Object.entries(this.inputItems.key).reduce((map, [id, item]) => {
                    if (item.isTag()) {
                        map[id] = {
                            "tag": item.getResource()
                        };
                    } else {
                        map[id] = {
                            "item": item.getResource()
                        };
                    }
                    return map;
                }, {}),
                "result": {
                    "item": this.outputItem.getResource(),
                    "count": this.outputItemCount
                }
            };
            if (this.category != null && this.category.length > 0) {
                recipe.category = this.category;
            }
            if (this.notifies != false) {
                recipe.show_notification = true;
            }
            return recipe;
        }
    }

    hasMultiple() {
        return false;
    }

    getRecipe() {
        return this.getCraftingRecipe();
    }

    generateName() {
        function aggregateIngredientsAndCounts(ingredients) {
            return Object.entries(ingredients.reduce((collection, item) => {
                const resourceId = item.getResource();
                if (!(resourceId in collection)) {
                    collection[resourceId] = 1;
                } else {
                    collection[resourceId] += 1;
                }
                return collection;
            }, {}))
                .map(([resourceId, resourceCount]) => (resourceCount > 1 ? resourceCount + '_' : '') + resourceId.split(":").pop())
                .join('_and_');
        }

        const ingredientsAggregate = this.isShapeless() ? aggregateIngredientsAndCounts(this.getInputItems()) : aggregateIngredientsAndCounts(Object.values(this.getInputItems().key));
        const outputItem = this.getOutput().item.getName();

        return 'crafting_' + outputItem + '_from_' + ingredientsAggregate;
    }
}