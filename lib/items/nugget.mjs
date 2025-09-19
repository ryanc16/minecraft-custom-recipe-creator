import { TieredItem } from "./tiered_item.mjs";

export class Nugget extends TieredItem {

    constructor(namespace, tier, id) {
        super(namespace, tier, id);
    }

    static iron() {
        return new Nugget('minecraft', 'iron', 'nugget');
    }

    static gold() {
        return new Nugget('minecraft', 'gold', 'nugget');
    }
}