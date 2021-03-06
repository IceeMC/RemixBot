const Arg = require("../framework/commandUsage/Arg.js");

class BooleanArg extends Arg {

    constructor(...args) {
        super(...args, { aliases: ["bool"] });
    }

    run(message, arg) {
        const trueArray = ["true", "+", "yes", "y", "yeah", "yep"];
        const falseArray = ["false", "-", "no", "n", "nope", "nah"];
        const included = trueArray.includes(arg) || falseArray.includes(arg);
        if (included) return included;
        throw message.language.get("ARG_BAD_BOOLEAN");
    }

}

module.exports = BooleanArg;