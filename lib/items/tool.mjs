import { TieredItem } from "./tiered_item.mjs";

export class Tool extends TieredItem {

    constructor(namespace, tier, type) {
        super(namespace, tier, type);
    }

    static type(type) {
        const builder = new ToolBuilder();
        builder._type = type;
        return builder;
    }

    static pickaxe() {
        return ToolBuilder.type('pickaxe');
    }

    static axe() {
        return ToolBuilder.type('axe');
    }

    static shovel() {
        return ToolBuilder.type('shovel');
    }

    static hoe() {
        return ToolBuilder.type('hoe');
    }
}

class ToolBuilder {
    _namespace;
    _tier;
    _type;

    static type(type) {
        const builder = new ToolBuilder();
        builder._type = type;
        return builder;
    }

    namespace(ns) {
        this._namespace = ns;
        return this;
    }

    tier(tier) {
        this._tier = tier;
        return this;
    }

    wooden() {
        return this.tier('wood');
    }

    stone() {
        return this.tier('stone');
    }

    gold() {
        return this.tier('golden');
    }

    iron() {
        return this.tier('iron');
    }

    diamond() {
        return this.tier('diamond');
    }

    netherite() {
        return this.tier('netherite');
    }

    build() {
        return new Tool(this._namespace ? this._namespace : "minecraft", this._tier, this._type);
    }
}