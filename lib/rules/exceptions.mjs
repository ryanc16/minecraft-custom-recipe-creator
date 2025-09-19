export class ParsingException {
    constructor(msg) {
        // super(msg);
        this.message = msg;
    }

    toString() {
        return this.message;
    }
}