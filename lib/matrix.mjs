export class Matrix {
    constructor(...data) {
        this.data = data.map(r => r.split('|').map(c => c.trim()));
        this.seriesNames = this.data[0];
        this.datasetNames = this.data.slice(1).map(r => r[0]);
    }

    forEach(fn) {
        for (let i = 1; i < this.seriesNames.length; i++) {
            for (let j = 0; j < this.datasetNames.length; j++) {
                fn(this.seriesNames[i], this.datasetNames[j], this.data[j + 1][i]);
            }
        }
    }
}