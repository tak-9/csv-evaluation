const fs = require("fs");
const readline = require("readline");
const { exit } = require("process");
const DELIMITER = ',';
// const keys = "ABCDEFGHIJK".split('');

main();

function main() { 
    const rs = fs.createReadStream("./input.csv", "utf8");
    const ws = fs.createWriteStream("./output.csv", "utf8");  

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
                let result = eval(cells[i])
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
    
    /*
    rl.on('close', () => {
        console.log("END!");
    });
    */    
}

function setValuesToJSON(str) {
    let jsonVal = {};
    let values = str.split(DELIMITER);
    let keys = generateKey(values.length);
    for (let i=0; i<keys.length; i++){
        jsonVal[keys[i]] = values[i];
    }
    return jsonVal;
}

// Generate Key (A,B,C...X,Y,Z,AA,AB,AC...,AX,AY,AZ,BA,BB,BC...,BX,BY,BZ,...ZX,ZY,ZZ)
function generateKey(len) {
    let keys = [];
    // There are 26 chars in A-Z. Support up to ZZ. (26*26) Return error if there are more characters.
    if ( len > 26 * 26 ) {
        // TODO: Consider how to return error. 
        console.log("ERROR: Too many cells in first row.")
        exit(1);
    }

    for (let i=0; i<len; i++) {
        let num = Math.floor(i / 26);
        let firstChar = ''
        if (num === 0) {
            firstChar = ''
        } else {
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
    for (var key in jsonValues) {
        if (jsonValues.hasOwnProperty(key)) {
            // Replace 'Key' with Number given in first row.
            var regularExp = new RegExp(key, 'g');
            str = str.replace(regularExp, jsonValues[key]);
        }
    }
    return str;
}

