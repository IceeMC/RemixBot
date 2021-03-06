const UsageTag = require("./UsageTag.js");

class CommandUsage {

    constructor(command, usage) {
        Object.defineProperty(this, "client", { value: command.client });
        this.command = command;
        this.usage = usage;
        this.usageTags = [];
        this.prepareTags();
    }

    prepareTag(split) {
        if (typeof split !== "string" && split.opening && split.closing)
            return new UsageTag(this.client, this.command, split);
        let [, opening, name, type, all, min, max, closing] = UsageTag.rgx.exec(split);
        if (!opening && !closing) throw `${split} could not be parsed opening/closing was not found.`;
        min = parseInt(min);
        max = parseInt(max);
        return new UsageTag(this.client, this.command, {
            opening,
            name,
            type,
            all,
            min,
            max,
            closing
        });
    }

    prepareTags() {
        if (!this.usage) return;
        Array.isArray(this.usage) ?
            this.usage.map(s => this.usageTags.push(this.prepareTag(s))) :
            !this.usage.split(" ").length ?
                this.usageTags.push(this.prepareTag(this.usage)) :
                this.usage.split(" ").map(s => this.usageTags.push(this.prepareTag(s)));
    }

    async run(message, index = 0) {
        const argArray = [];
        // Since, I Don't want to modify the actual message object, Ill clone it.
        const copied = this.client.utils.copyObject(message);
        copied.args = this.parseArgs(copied.args.join(" "));
        for (let i = (index || 0); i < this.usageTags.length; i++) {
            const usageTag = this.usageTags[i];
            const arg = this.command.quotes ?
                usageTag.all ? copied.args.slice(i).join(" ") : copied.args[i] :
                usageTag.all ? message.args.slice(i).join(" ") : message.args[i];
            if (!usageTag.required && !arg) {
                argArray.push(undefined);
                break;
            } else {
                const result = await usageTag.run(message, arg);
                argArray.push(result);
                continue;
            }
        }
        return argArray;
    }

    // https://github.com/dirigeants/klasa/blob/stable/src/lib/structures/CommandMessage.js#L201
    parseArgs(content) {
        const args = [];
        let parsed = "";
        let quotedOpened = false;

        for (let i = 0; i < content.length; i++) {
            if (!quotedOpened && content.slice(i, i + 1) === " ") {
                if (parsed !== "") args.push(parsed);
                parsed = "";
                continue;
            }
            if (content[i] === "\"" && content[i - 1] !== "\\") {
                quotedOpened = !quotedOpened;
                if (parsed !== "") args.push(parsed);
                parsed = "";
                continue;
            }
            parsed += content[i];
        }
        if (parsed !== "") args.push(parsed);
        return args;
    }

    get helpString() {
        let str = this.command.aliases.length > 0 ? `❰${[this.command.name, ...this.command.aliases].join("|")}❱` : this.command.name;
        str += this.command.subCommands.length > 1 ? ` <${this.command.subCommands.join("|")}>` : "";
        for (const tag of this.usageTags) {
            if (["type", "subCmd"].includes(tag.name)) continue;
            str += ` ${tag.opening}${tag.name}${tag.closing}`;
        }
        return str;
    }

}

module.exports = CommandUsage;
