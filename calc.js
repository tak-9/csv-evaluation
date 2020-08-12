const fs = require("fs");
const readline = require("readline");
const DELIMITER = ','; // Set this here as it may be changed to TAB.
const INPUT_FILE = "./input.csv";
const OUTPUT_FILE = "./output.csv";

main();

function main() { 
    const rs = fs.createReadStream(INPUT_FILE, "utf8");
    const ws = fs.createWriteStream(OUTPUT_FILE, "utf8");  

    const rl = readline.createInterface({
        input: rs,
        output: ws
    });
        
    let lineNumber = 0;
    let jsonValues = {};
    rl.on('line', (lineStr) => {
        if (lineNumber === 0) {
            // Parse CSV and set values to JSON. 
            jsonValues = setValuesToJSON(lineStr);
            // For first row, output the values as is. 
            console.log(lineStr);
            ws.write(lineStr + '\n');
        } else {
            // For all other rows, calculate value. 
            lineStr = replaceValues(jsonValues, lineStr);
            let cells = lineStr.split(DELIMITER);
            let lineOutput = ''; 
            for (let i=0; i<cells.length; i++){
                let result;
                if (validateFormular(cells[i])){
                    // 'eval' performs calculation
                    result = eval(cells[i])
                } else {
                    result = "ERROR";
                }
                if (i === 0){
                    lineOutput = result; 
                } else {
                    lineOutput = lineOutput + ', ' + result;
                }
            }
            console.log(lineOutput);
            ws.write(lineOutput + '\n');
        }
        lineNumber++;    
    });
    
    rl.on('close', () => {
        console.log("Completed.");
    });

    rs.on('error', () => {
        errorExit(1, "ERROR: Input file error.")
    });

    ws.on('error', () => {
        errorExit(1, "ERROR: Output file error.")
    });
}

function setValuesToJSON(str) {
    let jsonVal = {};
    let values = str.split(DELIMITER);
    let keys = generateKey(values.length);
    for (let i=0; i<keys.length; i++){
        // This will match: '123', '123.456' or '.456'
        let regExFloatNumber = /\s*[+-]?([0-9]*[.])?[0-9]+\s*/;
        if (!regExFloatNumber.test(values[i])){
            errorExit(1, "ERROR: Invalid format in first row.")
        }
        jsonVal[keys[i]] = values[i];
    }
    return jsonVal;
}

// This generates key based on number of cells. 'len' is number of cells in first row.
// Example [A,B,C...X,Y,Z,AA,AB,AC...,AX,AY,AZ,BA,BB,BC...,BX,BY,BZ,...ZX,ZY,ZZ] 
function generateKey(len) {
    let keys = [];
    // There are 26 chars in A-Z. Support up to ZZ. (26*26) Return error if there are more characters.
    if ( len > 26 * 26 ) {
        errorExit(1, "ERROR: Too many cells in first row.")
    }

    for (let i=0; i<len; i++) {
        let num = Math.floor(i / 26);
        let firstChar = ''
        if (num === 0) {
            firstChar = ''
        } else {
            // fromCharCode 65 is 'A'
            firstChar = String.fromCharCode(65+num-1);
        }
        let modVal = i % 26;
        let secondChar = String.fromCharCode(65+modVal);
        keys.push(firstChar + secondChar);
    }
    // console.log(keys);
    return keys;
}

// Replace Letters with Numeric values given in the first row.
function replaceValues(jsonValues, str) { 
    // Loop through jsonValues and get 'key/values'.
    let keysTwoChars = [];
    let keysOneChar = [];
    for (var key in jsonValues) {
        if (jsonValues.hasOwnProperty(key)) {
            if (key.length === 1) {
                // key with one character (For example, 'A').
                keysOneChar.push(key)
            } else {
                // key with two characters (For example, 'AX')
                keysTwoChars.push(key)
            }
        }
    }
    // Replace 'Key' alphabet with the corresponding number given in first row.
    // First, replace key with two characters (For example, 'AX'). Then, replace key with one character (For example, 'A').
    // console.log("keysOneChar", keysOneChar);
    // console.log("keysTwoChars", keysTwoChars);
    for (let i=0; i<keysTwoChars.length; i++) {
        let currentKey = keysTwoChars[i];
        let regularExp = new RegExp(currentKey, 'g');
        str = str.replace(regularExp, jsonValues[currentKey]);    
    }
    for (let i=0; i<keysOneChar.length; i++) {
        let currentKey = keysOneChar[i];
        let regularExp = new RegExp(currentKey, 'g');
        str = str.replace(regularExp, jsonValues[currentKey]);    
    }
    return str;
}

function validateFormular(formular) {
    // Error if formular contains invalid characters.
    let regExValidChars = /^[0-9\+\-*/\s\.\(\)]+$/;
    if (!regExValidChars.test(formular)){
        return false;
    }

    // Error if first char is '*' or '/' 
    // Error if last char is '+','-','/' or '*' 
    let regExInvalidFormat = /^[*\/]|[\+\-*/]$/;
    if (regExInvalidFormat.test(formular.trim())){
        return false;
    }

    // Error if another operator is used immediately after an operator. 
    // Error if Numbers appear consecutively. For example '5 1' is invalid but '51' is ok.
    // Example. A +* B , A--B, --A    
    let regExInvalidTwice = /([\+\-*/]\s*[\+\-\*/]|[0-9]\s+[0-9])/g;
    if (regExInvalidTwice.test(formular.trim())){
        return false;
    }

    // Error if first char after ( is '*' or '/' 
    // Error if last char before ) is '+','-','/' or '*'
    // Error if char before ( is number 
    // Error if char after ) is number
    let regExInvalidBracket = /(\(\s*[\/*]|[\+\-\/*]\)|[0-9]\s*\(|\)\s*[0-9])/;
    if (regExInvalidBracket.test(formular.trim())){
        return false;
    }

    if(!checkBrackets(formular)){
        return false;
    }
    
    // Everything looks good.
    return true;
} 

// Check if if there is corresponding bracket. 
function checkBrackets(formular){
    let stack = [];
    for (let i=0; i<formular.length; i++){
        let currentChar = formular.charAt(i);
        if (currentChar === '(') {
            stack.push(currentChar);
        } else if (currentChar === ')'){
            let stackResult = stack.pop();
            if (typeof stackResult === 'undefined'){
                // Brace is unbalance if it's trying to pop from empty stack. 
                return false;
            }
        }
    }
    // stack must be empty at the end. If it's not empty brace is in invalid format.
    return (stack.length === 0 ? true : false);
}

function errorExit(errorCode, msg){
    console.log(msg);
    process.exit(errorCode);
}
