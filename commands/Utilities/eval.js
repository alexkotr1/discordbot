const { client } = require('../../Client');
const Helper = require('../../Helper');
const { inspect } = require('util');
const { MessageActionRow, MessageButton } = require('discord.js');
function evaluate() {
    client.on("messageCreate", async (message) => {
        if (message.author.bot || !(await Helper.checkCommand(message, "eval") || message.author.id !== "198005161807970304")) return undefined;

        const args = message.content.replace("!eval", "").split(" ");
        let script = args.slice(1).join(" ");

        if (script.startsWith('```') && script.endsWith('```')) {
            script = script.replace(/(^.*?\s)|(\n.*$)/g, '');
        }

        let hrDiff;
        try {
            const hrStart = process.hrtime();
            const lastResult = evalAsync(message, script);
            hrDiff = process.hrtime(hrStart);

            const result = makeResultMessages(lastResult, hrDiff, script);

            message.reply({ content: result });
        } catch (err) {
            message.reply(`Error while evaluating: \`${err}\``);
        }
    });
}

async function evalAsync(message, script) {
    return eval(`(async () => { ${script} })()`);
}


function makeResultMessages(result, hrDiff, input = null) {
    const inspected = inspect(result, { depth: 0 })
        .replace(sensitivePattern(), '--snip--');
    const split = inspected.split('\n');
    const last = inspected.length - 1;
    const prependPart = inspected[0] !== '{' && inspected[0] !== '[' && inspected[0] !== "'" ? split[0] : inspected[0];
    const appendPart = inspected[last] !== '}' && inspected[last] !== ']' && inspected[last] !== "'" ?
        split[split.length - 1] :
        inspected[last];
    const prepend = `\`\`\`javascript\n${prependPart}\n`;
    const append = `\n${appendPart}\n\`\`\``;
    if (input) {
        return `*Executed in ${hrDiff[0] > 0 ? `${hrDiff[0]}s ` : ''}${hrDiff[1] / 1000000}ms.*\n\`\`\`javascript\n${inspected}\n\`\`\``;
    } else {
        return `*Callback executed after ${hrDiff[0] > 0 ? `${hrDiff[0]}s ` : ''}${hrDiff[1] / 1000000}ms.*\n\`\`\`javascript\n${inspected}\n\`\`\``;
    }
}

function sensitivePattern() {
    let pattern = '';
    if (client.token) pattern += escapeRegex(client.token);
    return new RegExp(pattern, 'gi');
}
function escapeRegex(str) {
    return str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
}

module.exports = evaluate