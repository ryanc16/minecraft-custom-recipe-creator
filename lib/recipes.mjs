

const SMELTING_TEMPLATE = {
    "type": "minecraft:smelting",
    "category": "misc",
    "cookingtime": 200,
    "experience": 0.1,
    "ingredient": [],
    "result": {}
};

const BLASTING_TEPLATE = {
    "type": "minecraft:blasting",
    "category": "misc",
    "cookingtime": 100,
    "experience": 0.1,
    "ingredient": [],
    "result": {}
};

export class SmeltingRecipeBuilder {

    _category = "misc";
    _cookingTime = 200;
    _experience = 0.1;
    _ingredient = [];
    _result = {};

    static create() {
        return new SmeltingRecipeBuilder();
    }

    category(category) {
        this._category = category;
        return this;
    }

    cookingTime(time) {
        this._cookingTime = time;
        return this;
    }

    experience(amt) {
        this._experience = amt;
        return this;
    }

    ingredients(ingredientList) {
        this._ingredient = ingredientList;
        return this;
    }

    ingredient(ingredient) {
        this._ingredient.push(ingredient);
        return this;
    }

    result(result) {
        this._result = result;
        return this;
    }

    resultItem(resultItem) {
        this._result.item = resultItem;
        return this;
    }

    resultCount(resultItemCount) {
        this._result.count = resultItemCount;
        return this;
    }

    build() {
        const self = this;
        return extend_recipe(SMELTING_TEMPLATE, function(recipe) {
            recipe.category = self._category;
            recipe.cookingtime = self._cookingTime;
            recipe.experience = self._experience;
            recipe.ingredient = self._ingredient.map(_item => {
                if (_item.isTag()) {
                    return {
                        tag: _item.getResource()
                    };
                } else {
                    return {
                        item: _item.getResource()
                    };
                };
            });
            recipe.result = self._result;
            recipe.result.item = self._result.item.getResource();
        });
    }
}

export class BlastingRecipeBuilder extends SmeltingRecipeBuilder {

    _category = "misc";
    _cookingTime = 100;
    _experience = 0.1;
    _ingredient = [];
    _result = {};

    static create() {
        return new BlastingRecipeBuilder();
    }

    build() {
        const self = this;
        return extend_recipe(BLASTING_TEPLATE, function(recipe) {
            recipe.category = self._category;
            recipe.cookingtime = self._cookingTime;
            recipe.experience = self._experience;
            recipe.ingredient = self._ingredient.map(_item => {
                if (_item.isTag()) {
                    return {
                        tag: _item.getResource()
                    };
                } else {
                    return {
                        item: _item.getResource()
                    };
                };
            });
            recipe.result = self._result;
            recipe.result.item = self._result.item.getResource();
        });
    }

}

export class Smelting {
    constructor(item) {
        this._items = [item];
    }
    static of(item) {
        return new Smelting(item);
    }

    or(item) {
        this._items.push(item);
        return this;
    }

    produces(quantity, outputItem) {
        this._quantity = quantity;
        this._outputItem = outputItem;
        return this;
    }

    ingredients() {
        return this._items.map(item => ({ item: item.build().getResource() }));
    }

    product() {
        return { item: this._outputItem.getResource(), count: this._quantity };
    }

    smeltingRecipe() {
        return SmeltingRecipeBuilder.create()
            .ingredients(this.ingredients())
            .resultItem(this.product().item)
            .resultCount(this.product().count)
            .build();
    }

    blastingRecipe() {
        return BlastingRecipeBuilder.create()
            .ingredients(this.ingredients())
            .resultItem(this.product().item)
            .resultCount(this.product().count)
            .build();
    }
}

const STONECUTTING_TEMPLATE = {
    "type": "minecraft:stonecutting",
    "ingredient": {
        "item": ""
    },
    "result": "",
    "count": 1
};

export class StonecuttingRecipeBuilder {

    _ingredient = null;
    _result = null;
    _count = 1;

    static create() {
        return new StonecuttingRecipeBuilder();
    }

    ingredient(item) {
        this._ingredient = item;
        return this;
    }

    result(result) {
        this._result = result.item;
        this._count = result.count;
        return this;
    }

    resultItem(item) {
        this._result = item;
        return this;
    }

    resultCount(count) {
        this._count = count;
        return this;
    }

    build() {
        const self = this;
        return extend_recipe(STONECUTTING_TEMPLATE, function(recipe) {
            if (self._ingredient.isTag()) {
                recipe.ingredient = {
                    tag: self._ingredient.getResource()
                };
            } else {
                recipe.ingredient = {
                    item: self._ingredient.getResource()
                };
            }
            recipe.result = self._result.getResource();
            recipe.count = self._count;
        });
    }
}

export function extend_recipe(baseRecipe, fn) {
    const extended = Object.assign({}, JSON.parse(JSON.stringify(baseRecipe)));
    fn(extended);
    return extended;
}