const processNotPointer = ({ origin }, varName, currentScope, Stack, rightResult = null, Types, getValueAndType) => {
    currentScope.scope[varName] = {
        type: origin,
        name: varName,
        value: null
    };

    if (rightResult){
        const rightInstance = getValueAndType(rightResult);

        if(currentScope.scope[varName].type === 'Integer' && rightInstance.type === 'Real'){
            rightInstance.value = parseInt(rightInstance.value, 10);
            rightInstance.type = 'Integer';
        } else if(currentScope.scope[varName].type === 'Real' && rightInstance.type === 'Integer'){
            rightInstance.value = parseFloat(rightInstance.value, 10);
            rightInstance.type = 'Real';
        } else if(currentScope.scope[varName].type !== rightInstance.type){
            throw new Error(`LINE ${astNode.line+1}: Cannot asign value of different type.`);
        }

        currentScope.scope[varName].value = rightInstance.value;
        Stack.replaceByIndex(undefined, Object.assign({}, currentScope));
        
        console.log("valor "+currentScope.scope[varName].value);
    }
};

const processPointer = ({ origin }, varName, currentScope, Stack, rightResult = null, Types, getValueAndType) => {
    currentScope.scope[varName] = {
        type: 'Pointer',
        dir: null,
        pt: origin,
        name: null
    };

    if(rightResult){
        const rightInstance = getValueAndType(rightResult);
        if(rightResult.type === 'Pointer'){
            currentScope.scope[varName].dir = null;
            currentScope.scope[varName].name = null;
        } else if(currentScope.scope[varName].pt === rightInstance.type) {
            currentScope.scope[varName].dir = rightInstance.node;
            currentScope.scope[varName].name = rightResult.name || null;
        } else if(rightInstance.type === 'Pointer' && rightInstance.pt === currentScope.scope[varName].pt) {
            currentScope.scope[varName] = rightInstance.node;
        } else {
            throw new Error(`Pointer ${varName} of type ${origin} cannot be asigned to ${rightResult.name || rightResult.type}`);
        }
    }

    Stack.replaceByIndex(undefined, Object.assign({}, currentScope));
};

module.exports = (astNode, eval, { Stack, FindScope, Types, notInCurrentScope, getValueAndType }) => {
    const rightResult = eval(astNode.right);
    const variableType = {
        origin: astNode.left
    };

    try {
        if(!(variableType.origin in Types)){
            variableType = FindScope(variableType, Stack.size()-1)[variableType.origin];   
        }

        const currentScope = notInCurrentScope(astNode.name);
        
        if(!currentScope) throw new Error(`LINE ${astNode.line+1}: Duplicated definition of identifier ${astNode.name}`);

        if('point' in astNode){
            processPointer(variableType, astNode.name, currentScope, Stack, rightResult, Types, getValueAndType);
        } else {
            processNotPointer(variableType, astNode.name, currentScope, Stack, rightResult, Types, getValueAndType);
        }

        return eval(astNode.next);
    } catch(error) {
        throw error;
    }
};