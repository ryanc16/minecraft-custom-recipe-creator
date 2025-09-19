export default {
    toContainKey: function() {
        return {
            compare: function(actual, expectedKey) {
                const result = {};
                result.pass = Object.prototype.hasOwnProperty.call(actual, expectedKey);

                if (result.pass) {
                    result.message = `Expected ${JSON.stringify(actual)} not to contain key '${expectedKey}'`;
                } else {
                    result.message = `Expected ${JSON.stringify(actual)} to contain key '${expectedKey}'`;
                }

                return result;
            }
        };
    }
};
