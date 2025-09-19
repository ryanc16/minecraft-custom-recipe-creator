import { Item } from "./item.mjs";

export class TieredItem extends Item {
    constructor(namespace, tier, id) {
        super(namespace, id);
        this._tier = tier;
    }

    getTier() {
        return this._tier;
    }

    getName() {
        return [this._tier, this._id].join("_");
    }

    getResource() {
        return [this._namespace, this.getName()].join(":");
    }
}