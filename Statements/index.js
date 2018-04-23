const fs = require('fs');

const folder = `${__dirname}/../Statements/`;
const Statements = {};

fs.readdir(folder, (err, files) => {
    if(err) throw new Error(err);

    for(file of files) {
        Statements[file.replace('.js', '')] = require(`./${file}`);
    }
});

module.exports = Statements;