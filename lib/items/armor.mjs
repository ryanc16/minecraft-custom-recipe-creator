import { TieredItem } from "./tiered_item.mjs";

export class Armor extends TieredItem {

    constructor(namespace, tier, type) {
        super(namespace, tier, type);
    }

    static type(type) {
        const builder = new ArmorBuilder();
        builder._type = type;
        return builder;
    }

    static helmet() {
        return ArmorBuilder.type('helmet');
    }

    static chestplate() {
        return ArmorBuilder.type('chestplate');
    }

    static leggings() {
        return ArmorBuilder.type('leggings');
    }

    static boots() {
        return ArmorBuilder.type('boots');
    }

    static forHorse() {
        return ArmorBuilder.type('horse_armor');
    }
}

class ArmorBuilder {
    _namespace;
    _tier;
    _type;

    static type(type) {
        const builder = new ArmorBuilder();
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

    leather() {
        return this.tier('leather');
    }

    chainmail() {
        return this.tier('chainmail');
    }

    iron() {
        return this.tier('iron');
    }

    gold() {
        return this.tier('golden');
    }

    diamond() {
        return this.tier('diamond');
    }

    netherite() {
        return this.tier('netherite');
    }

    build() {
        return new Armor(this._namespace ? this._namespace : "minecraft", this._tier, this._type);
    }
}