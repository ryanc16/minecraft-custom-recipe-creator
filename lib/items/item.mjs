export class Item {
    constructor(namespace, id) {
        if (id == null) {
            const parts = namespace.split(":");
            if (parts.length === 2) {
                this._namespace = parts[0].replace('#', '');
                this._id = parts[1];
                this._isTag = parts[0].includes('#');
            } else {
                this._namespace = 'minecraft';
                this._id = namespace.replace('#', '');
                this._isTag = namespace.includes('#');
            }
        } else {
            this._namespace = namespace;
            this._id = id;
        }
    }

    static of(namespace, id) {
        return new Item(namespace, id);
    }

    namespace(namespace) {
        this._namespace = namespace;
        return this;
    }

    isTag() {
        return this._isTag;
    }

    getNamespace() {
        return this._namespace != null ? this._namespace : "minecraft";
    }

    getName() {
        return this._id;
    }

    getResource(namespace) {
        return [(namespace ? namespace : this._namespace ? this._namespace : "minecraft"), this.getName()].join(":");
    }
}