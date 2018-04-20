class Stack {
    constructor(array = []) {
        if(!Array.isArray(array))
            throw new Error(`Stack only accepts arrays to build, not: ${array.constructor}`);
        
        this.stack = array;
    }

    top() {
        return this.getByIndex();
    }

    push(element = null) {
        this.stack.push(element);
    }

    replaceByIndex(index = this.stack.length-1, newElement = {}) {
        this.stack[index] = newElement;
    }

    pop() {
        return this.stack.pop();
    }

    size() {
        return this.stack.length;
    }

    getByIndex(index = this.stack.length-1) {
        if(typeof index !== 'number')
            throw new Error(`getByIndex function only accepts numbers, not: ${index.constructor}`);

        return this.stack[index];
    }
}

module.exports = Stack;