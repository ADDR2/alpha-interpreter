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
    const variableType = astNode.left;

    try {
        if(!(variableType in Types)){
            const scopeType = FindScope(variableType, Stack.size()-1);
            const currentScope = notInCurrentScope(astNode.name);
            
            if(!currentScope) throw new Error(`LINE ${astNode.line+1}: Duplicated definition of identifier ${astNode.name}`);

            if('point' in astNode){
                processPointer(scopeType[variableType], astNode.name, currentScope, Stack, rightResult, Types, getValueAndType);
            }

        }
    } catch(error) {
        throw error;
    }

    if (astNode.left in FindScope(astNode.left, Stack.size()-1) && !(astNode.name in Stack.top())){
        aux_type = astNode.left;
        if (astNode.point){
            Stack.top()[astNode.name] = new AstNode('Pointer', {dir: null, pt: FindType(astNode.left).origin, name: null});
            console.log("pointer detected");
            if (rg){
                if (rg.type == 'Pointer'){
                    Stack.top()[astNode.name].dir = null;
                    Stack.top()[astNode.name].name = null;
                }else{
                    if (Stack.top()[astNode.name].pt == PointerValue(rg).origin){
                        Stack.top()[astNode.name].dir = PointerValue(rg);
                        Stack.top()[astNode.name].name = rg.name;
                    }else{
                        if (PointerValue(rg).type == 'Pointer' && PointerValue(rg).pt == Stack.top()[astNode.name].pt){
                            Stack.top()[astNode.name] = PointerValue(rg);
                        }else{
                            console.log("Error en la linea " + (astNode.line+1) + ": Mala asignacion de apuntador");
                            return null;
                        }
                    }
                }
            }
        }else{
            Stack.top()[astNode.name] = FindType(astNode.left);
            if (rg != null){
                rg = Value(rg);
                if(Stack.top()[astNode.name].type == rg.type){
                    console.log("buena declaracion");
                }else{
                    if (Stack.top()[astNode.name].type == 'Integer' && rg.type == 'Real'){
                        rg.value = parseInt(rg.value);
                        rg.type = 'Integer';
                        console.log("buena transformacion a Integer "+rg.value);
                    }else{
                        if (Stack.top()[astNode.name].type == 'Real' && rg.type == 'Integer'){
                            rg.value = parseFloat(rg.value);
                            rg.type = 'Real';
                            console.log("buena transformacion a Real "+rg.value);
                        }else{
                            console.log("Error en la linea " + (astNode.line+1) + ": No se puede asignar el valor");
                            return null;
                        }
                    }
                }
                Stack.top()[astNode.name].value = rg.value;
                console.log("valor "+Stack.top()[astNode.name].value);
            }
        }
    }else{
        aux_type = astNode.left;
        if (astNode.left == 'Integer' || astNode.left == 'Char' || astNode.left == 'String' || astNode.left == 'Boolean' || astNode.left == 'Real'){ 
            if (astNode.point){
                Stack.top()[astNode.name] = new AstNode('Pointer', {dir: null, pt: astNode.left, name: null});
                console.log("pointer detected");
                if (rg){
                    if (rg.type == 'Pointer'){
                        Stack.top()[astNode.name].dir = null;
                        Stack.top()[astNode.name].name = null;
                    }else{
                        if (Stack.top()[astNode.name].pt == PointerValue(rg).type){
                            Stack.top()[astNode.name].dir = PointerValue(rg);
                            Stack.top()[astNode.name].name = rg.name;
                        }else{
                            if (PointerValue(rg).type == 'Pointer' && PointerValue(rg).pt == Stack.top()[astNode.name].pt){
                                Stack.top()[astNode.name] = PointerValue(rg);
                            }else{
                                console.log("Error en la linea " + (astNode.line+1) + ": Mala asignacion de apuntador");
                                return null;
                            }
                        }
                    }
                }
            }else{
                if (rg){
                    rg = Value(rg);
                    if(astNode.left == rg.type){
                        console.log("buena declaracion");
                    }else{
                        if (astNode.left == 'Integer' && rg.type == 'Real'){
                            rg.value = parseInt(rg.value);
                            rg.type = 'Integer';
                            console.log("buena transformacion a Integer "+rg.value);
                        }else{
                            if (astNode.left == 'Real' && rg.type == 'Integer'){
                                rg.value = parseFloat(rg.value);
                                rg.type = 'Real';
                                console.log("buena transformacion a Real "+rg.value);
                            }else{
                                console.log("Error en la linea " + (astNode.line+1) + ": No se puede asignar el valor");
                                return null;
                            }
                        }
                    }
                    if(!(astNode.name in Stack.top())) {
                        Stack.top()[astNode.name] = rg;
                        Stack.top()[astNode.name].origin = astNode.name;
                        console.log("valor "+Stack.top()[astNode.name].value);
                    }else{
                        console.log("Error en la linea " + (astNode.line+1) + ": La variable "+astNode.name+" ya esta declarada");
                    }
                }else{
                    Stack.top()[astNode.name] = new AstNode(astNode.left, {value : null, origin: astNode.name});
                    console.log("La variable "+astNode.name+" no tiene valor");
                }
            }
        }else{
            console.log("Error en la linea " + (astNode.line+1) + ": El tipo de dato " + astNode.left + " se desconoce");
            return null;
        }
    }
    v = eval(astNode.next);
};