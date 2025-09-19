import { Item } from "./item.mjs";
import { TieredItem } from "./tiered_item.mjs";

export class Ingot extends TieredItem {

    constructor(namespace, tier, id) {
        super(namespace, tier, id);
    }

    static iron() {
        return new Ingot('minecraft', 'iron', 'ingot');
    }

    static gold() {
        return new Ingot('minecraft', 'gold', 'ingot');
    }
}
