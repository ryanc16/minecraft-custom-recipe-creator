# Minecraft Custom Recipe Generator
This project allows easily creating custom minecraft recipes using natural language descriptions, and packaging them up into a datapack that can be added to a minecraft game installation.

## How it works
By using a natural-like language to describe the minecraft recipe you want to have made, the application outputs the resulting json recipe minecraft will understand and load into the game. The recipe json files are packaged up into a datapack that can be added to the game installation.

### Crafting - Shapeless
**Syntax**: `crafting [quantity] <output_item> requires [quantity] <input_item1> [, [quantity] <input_item2> ...]`
- `crafting` - Identifies this recipe as a crafting recipe.
- `quantity` - Optionally, a quantity can be specified for the number of items. Acceptable values include "a", "an", or a whole number. When omitted, a quantity of 1 is assumed, which is also the case for "a" and "an". These just afford a more naturally reading recipe sentence.
- `<[namespace:]item>` - Items and tags can be namespaced using the format `namespace:item`. By default when no namespace is provided in the recipe, the "minecraft" namespace is assumed. However, if creating a recipe that uses items from a mod, it will require using its namespace (`custommod:cool_item`).
    - `item` - An item can be referenced using its unique in-game item identifier. Some recipes don't require a specific item, and instead group items by tags (think about things like wool and all the color variations). These can be denoted using `#`. For example `#minecraft:wool` or `#wool`.
- `requires` - Begins the list of required items to craft the output item.

Although this might all sound a little complicated, it is actually quite simple, and will feel intuitive after writing a couple recipes. There are really only a few basic requirements to write a recipe. The first thing is to specify it is a `crafting` recipe. Next specify the item that will be crafted, optionally providing a quantity. Then start the ingredient list using `requires` and provide each required item identifier or tag, again optionally providing a quantity for each.

#### Simple Recipe Example
Suppose we want a recipe that provides a way to craft string from wool of any color.
```
crafting 4 string requires #wool
```
This tells the parsing and generation step to produce a json file that minecraft recognizes as a valid recipe, and looks like this:
```json
{
    "type": "minecraft:crafting_shapeless",
    "ingredients": [
        {
            "tag": "minecraft:wool"
        }
    ],
    "result":{
        "item": "minecraft:string",
        "count": 4
    }
}
```
This recipe json needs to be packaged up inside a zip archive with some extra metadata, making it a complete datapack. This project facilitates that step as well.

### Crafting - Shaped
**Syntax**: `crafting [quantity] <output_item> requires <input_item1> <symbol_identifier> [, <input_item2> <symbol_identifier> ...] shaped <[<symbol_identifer1>, <symbol_identifier2>, <symbol_identifier3>], ...> [and is categorized as <category>] [and shows notification]`

For more complex recipes, such as ones that need to be a specific shape, this project also supports those as well.

#### Example 1
Suppose we have already covered ourselves in diamond armor, but now our trusty steed needs some diamond armor as well.

Input:
```
crafting diamond_horse_armor requires
    #wool W,
    diamond d
shaped
    [  d],
    [dWd],
    [ddd]
```
Output:
```json
{
    "type": "minecraft:crafting_shaped",
    "pattern": [
        "  d",
        "dWd",
        "ddd"
    ],
    "key": {
        "W": {
            "tag": "minecraft:wool"
        },
        "d": {
            "item": "minecraft:diamond"
        }
    },
    "result": {
        "item": "minecraft:diamond_horse_armor",
        "count": 1
    }
}
```
#### Example 2
Suppose we want an alternative way to create arrows that doesn't require flint, and instead use iron nuggets.

Input:
```
crafting 2 arrows requires
    iron_nugget ^,
    stick |,
    feather X
shaped
    [^],
    [|],
    [X]
and is categorized as equipment
```
Output:
```json
{
    "type": "minecraft:crafting_shaped",
    "pattern": [
        "^",
        "|",
        "X"
    ],
    "key": {
        "^": {
            "item": "minecraft:iron_nugget"
        },
        "|": {
            "item": "minecraft:stick"
        },
        "X": {
            "item": "minecraft:feather"
        }
    },
    "result": {
        "item": "minecraft:arrow",
        "count": 2
    },
    "category": "equipment"
}
```
## Other recipe types
Not only can we create crafting recipes, we can also create smelting, blasting, and stonecutting recipes.

### Smelting & Blasting

```
smelting an anvil produces 13 iron_ingot and takes 2600 ticks
```
```
blasting an anvil produces 13 iron_ingot and takes 1300 ticks
```
```
smelting or blasting a chainmail_helmet produces 3 iron_nugget
```
```
smelting or blasting a golden_horse_armor produces 4 gold_ingot and grants 1 experience
```
```
smelting or blasting of
    iron_pickaxe,
    iron_shovel,
    iron_axe,
    iron_hoe,
    iron_sword
produces 1 iron_ingot
```
### Stonecutting

```
stonecutting glass produces 6 glass_pane
```
