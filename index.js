const { AST, parser } = require('./origin.js');
const { eval, Emitter } = require('./semantic_parser');

const defaultLogger = (type, message, timeStamp, code) => {
    console.log(`${type}: ${message} - [${timeStamp}] - (${code})`);
};

class AlphaInterpreter {
    constructor(logger = defaultLogger) {
        Emitter.on('info', logger);
        Emitter.on('warning', logger);
        Emitter.on('error', logger);
    }

    run(code) {
        try {
            eval(parser.parse(code));
        } catch(error) {
            throw error;
        }
    }
}

new AlphaInterpreter().run("String a = \"algo\";");

module.exports = AlphaInterpreter;