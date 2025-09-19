export class Potion {

    constructor(type) {
        this._type = type;
    }

    static of(type) {
        return new Potion(type);
    }

    longVariant() {
        this._long = true;
        return this;
    }

    strongVariant() {
        this._strong = true;
        return this;
    }

    variants() {
        const variants = [this._type];
        if (this._long) {
            variants.push(['long', this._type].join('_'));
        }
        if (this._strong) {
            variants.push(['strong', this._type].join('_'));
        }
        return variants;
    }
}