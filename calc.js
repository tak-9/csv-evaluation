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
            // For first row, output the values as is. 
            // Parse CSV and set values to JSON. 
            jsonValues = setValuesToJSON(lineStr);
            console.log(lineStr);
            ws.write(lineStr + '\n');
            lineNumber++;    
            return;
        } 

        // For all other rows, calculate value. 
        let cells = lineStr.split(DELIMITER);
        let lineOutput = ''; 
        for (let i=0; i<cells.length; i++){
            let cell;
            if (validateFormular(cells[i])){
                cell = replaceValues(jsonValues, cells[i]);
                try {
                    // 'eval' performs calculation
                    result = eval(cell)
                } catch (e) {
                    result = "ERROR";
                }
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
        let regExFloatNumber = /^[+-]?([0-9]*[.])?[0-9]+$/;
        if (!regExFloatNumber.test(values[i].trim())){
            errorExit(1, "ERROR: Invalid format in first row.")
        }
        jsonVal[keys[i]] = values[i];
    }
    //console.log(jsonVal);
    return jsonVal;
}

// This generates key based on number of cells. 'len' is number of cells in first row.
// Example [A,B,C...X,Y,Z] 
function generateKey(len) {
    let keys = [];
    // There are 26 chars in A-Z. Return error if there are more characters.
    if ( len > 26 ) {
        errorExit(1, "ERROR: Too many cells in first row.")
    }

    for (let i=0; i<len; i++) {
        // fromCharCode 65 is 'A'
        let ch = String.fromCharCode(65 + (i % 26));
        keys.push(ch);
    }
    //console.log(keys);
    return keys;
}

// Replace Letters with Numeric values given in the first row.
function replaceValues(jsonValues, str) { 
    // Loop through jsonValues and get 'key/values'.
    for (var key in jsonValues) {
        if (jsonValues.hasOwnProperty(key)) {
            let regularExp = new RegExp(key, 'g');
            str = str.replace(regularExp, jsonValues[key]);        
        }
    }
    return str;
}

// Validate Formular for security reason as 'eval' can execute any kind of JavaScript code.
// This prevents most JavaScript code to be executed as only upper case character is allowed. 
function validateFormular(formular) {
    // Error if formular contains invalid characters.
    let regExValidChars = /^[A-Z\+\-*/\s\.\(\)]+$/;
    if (!regExValidChars.test(formular.trim())){
        return false;
    }

    // Error if two or more [A-Z] letters. For example, AA - ABC
    let regExThreeLetters = /[A-Z]{2,}/;
    if (regExThreeLetters.test(formular)){
        return false;
    }
    
    // Everything looks good.
    return true;
} 

function errorExit(errorCode, msg){
    console.log(msg);
    process.exit(errorCode);
}
