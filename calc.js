const fs = require("fs");
const readline = require("readline");
// This may be replaced by tab character.
const DELIMITER = ',';
const keys = "ABCDEFGHIJK".split('');

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
    for (let i=0; i<keys.length; i++){
        jsonVal[keys[i]] = values[i];
    }
    return jsonVal;
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

