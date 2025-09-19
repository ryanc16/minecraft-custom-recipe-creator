import { default as moo } from 'moo';
import { ItemRule } from './item_rule.mjs';
import { SmeltingRule } from './smelting_rule.mjs';
import { ParsingException } from './exceptions.mjs';

export class AliasRule {

    constructor(name, value) {
        this.name = name;
        this.value = value;
    }

    static parse(rule) {
        const parsed = {
            name: null,
            value: null
        };

        const lexer = moo.compile({
            whitespace: /[ \t]+/,
            int: { match: /\d+/, value: v => parseInt(v) },
            decimal: { match: /[\d]+(?:\.\d+)?/, value: v => parseFloat(v) },
            list: { match: /\w+(?:,\w+)+/, value: v => v.split(',') },
            item_ref: /\b\w+\:\w+\b/,
            IDEN: {
                match: /\w+/,
                type: moo.keywords({
                    alias_rule: ['alias'],
                    value_start: ['to'],
                    other_rule: ['item', 'smelting', 'blasting', 'recipe', 'crafting']
                })
            },
            string: /\w+/
        });
        lexer.reset(rule);
        let token = lexer.next();
        const nextWord = () => {
            token = lexer.next();
            while (token?.type === 'whitespace') {
                token = lexer.next();
            }
        };
        if (token != null) {
            if (token.type === 'alias_rule') {
                nextWord();
                parsed.name = token.value;
                nextWord();
                if (token == null || token.type !== 'value_start') {
                    throw new ParsingException('invalid syntax: must assign alias to another value.');
                } else {
                    nextWord();
                    if (token.type !== 'other_rule') {
                        // TODO: throw fit
                    }
                    if (token.value === 'item') {
                        parsed.value = ItemRule.parse(rule.substring(token.offset));
                    } else if (['smelting', 'blasting'].includes(token.value)) {
                        parsed.value = SmeltingRule.parse(rule.substring(token.offset));
                    } else if (token.value === 'crafting') {
                        // TODO: crafting rule
                    } else if (token.value === 'recipe') {
                        // TODO: recipe rule
                    } else {
                        // TODO: none of these?
                    }
                }
            }
        }
        return new AliasRule(parsed.name, parsed.value);
    }

    hasMultiple() {
        return false;
    }

    getRecipe() {
        return {};
    }
}