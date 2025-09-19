import { TieredItem } from "./tiered_item.mjs";

export class Weapon extends TieredItem {

    constructor(namespace, tier, type) {
        super(namespace, tier, type);
    }

    static type(type) {
        const builder = new WeaponBuilder();
        builder._type = type;
        return builder;
    }

    static sword() {
        return WeaponBuilder.type('sword');
    }
}

class WeaponBuilder {
    _namespace;
    _tier;
    _type;

    static type(type) {
        const builder = new WeaponBuilder();
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
        return new Weapon(this._namespace ? this._namespace : "minecraft", this._tier, this._type);
    }
}