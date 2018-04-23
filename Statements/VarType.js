module.exports = ({ name, left }, eval, { Stack, notInCurrentScope }) => {
    try{
        const currentScope = notInCurrentScope(name);
        currentScope.scope[name] = {
            type: left,
            value: null,
            origin: name
        };

        Stack.replaceByIndex(undefined, Object.assign({}, currentScope));
    } catch(error) {
        throw error;
    }
};