import { default as moo } from 'moo';
import { Item } from '../items/item.mjs';
import { ParsingException } from './exceptions.mjs';

export class ItemRule {

    constructor(item, nbt, variants) {
        const parts = item.split(':');
        if (parts.length > 1) {
            this.namespace = parts[0];
            this.type = parts[1];
        } else {
            this.namespace = 'minecraft';
            this.type = item;
        }
        this.nbt = nbt;

        this.variants = [];
        if (variants != null && Array.isArray(variants)) {
            this.variants = this.variants.concat(variants);
        }
    }


    static parse(rule) {
        const parsed = {
            item: null,
            exists: false,
            nbt: null,
            variants: []
        };
        const lexer = moo.compile({
            whitespace: /[ \t]+/,
            int: { match: /\d+/, value: v => parseInt(v) },
            decimal: { match: /[\d]+(?:\.\d+)?/, value: v => parseFloat(v) },
            list: { match: /\w+(?:,\w+)+/, value: v => v.split(',') },
            nbt: /(?:\w+\:\{[\w\\\"\:\_]+\},?)+/,
            item_ref: /\b\w+\:\w+\b/,
            IDEN: {
                match: /\w+/,
                type: moo.keywords({
                    item_rule: ['item'],
                    exists_keyword: ['exists'],
                    addition_start: ['with'],
                    addition_type: ['variants', 'nbt'],
                    additions_aggregate: ['and']
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
        const getAllAdditions = () => {
            while (['addition_start', 'additions_aggregate'].includes(token?.type)) {
                nextWord();
                if (token?.type !== 'addition_type') {
                    if (token == null) {
                        throw new ParsingException('invalid syntax: missing attribute following with');
                    } else {
                        throw new ParsingException(`invalid syntax: unknown attribute "${token.value}"`);
                    }
                }
                if (token.value === 'variants') {
                    nextWord();
                    if (token == null) {
                        throw new ParsingException('invalid syntax: required variant item(s)');
                    } else if (token.type === 'list') {
                        parsed.variants = token.value;
                    } else if (token.type === 'string') {
                        parsed.variants.push(token.value);
                    }
                } else if (token.value === 'nbt') {
                    nextWord();
                    if (token == null) {
                        throw new ParsingException('invalid syntax: nbt data required');
                    } else if (token.type === 'nbt') {
                        parsed.nbt = token.value;
                    } else {
                        throw new ParsingException("invalid syntax: nbt data inproper format.");
                    }
                }
                nextWord();
            }
        };

        if (token.type === 'item_rule') {
            nextWord();
            const item = token.value;
            parsed.item = new Item(item).getResource();
            nextWord();
            while (token != null) {
                if (token?.type === 'exists_keyword') {
                    nextWord();
                    parsed.exists = true;

                } else if (token?.type === 'addition_start') {
                    // nextWord();
                    getAllAdditions();
                }
            }
        }
        return new ItemRule(parsed.item, parsed.nbt, parsed.variants);
    }

    getNamespace() {
        return this.getResource().split(':')[0];
    }

    getName() {
        return this.getResource().split(':')[1];
    }

    getResource() {
        return [this.namespace, this.type].join(':');
    }

    hasNBTData() {
        return this.nbt != null;
    }

    getNBTData() {
        return this.nbt;
    }

    hasVariants() {
        return this.variants.length > 0;
    }

    hasMultiple() {
        return this.hasVariants();
    }

    getVariants() {
        return this.variants.map(variant => `${this.getNamespace()}:${variant}_${this.getName()}`);
    }
}