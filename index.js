const { AST, parser } = require('./Processors/Parser');
const { eval, Emitter } = require('./Processors/Semantic');

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

new AlphaInterpreter().run("Integer a = 1 + 5 Integer b = a + 0.5");

module.exports = AlphaInterpreter;