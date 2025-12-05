let display = document.getElementById('current-operand')
let previousOperandDisplay = document.getElementById('previous-operand');
let resultDisplayed = false;

// Variables para recordar la última operación
let lastOperation = null; // Guardará { operator: '+', operand: '5' }
let isRepeatOperation = false; // Bandera para saber si estamos repitiendo


function isLastNumberDecimal(numberString){
    let lastNumberMatch = numberString.match(/(-?\d+(\.\d+)?|\(-\d+(\.\d+)?\))$/);
    if (!lastNumberMatch) return false;
    return lastNumberMatch[0].includes('.');
}

function appendNumber(number){
    if (resultDisplayed){
        // Si el usuario escribe un número después de un resultado, reseteamos todo
        display.textContent = '0';
        previousOperandDisplay.textContent = '';
        resultDisplayed = false;
        lastOperation = null; // Reseteamos la operación guardada
        isRepeatOperation = false;
    }
    if (display.textContent == '0' && number != '.'){
       display.textContent = '';
    }
    if (number == '.' && isLastNumberDecimal(display.textContent)){
        return;
    }
    newContent = formatExpression(display.textContent + number);
    display.textContent = newContent;
}

function appendOperator(operator){
    if (display.textContent == NaN || display.textContent == Infinity || display.textContent == -Infinity) {
        return;
    }
    if (resultDisplayed){
        previousOperandDisplay.textContent = '';
        resultDisplayed = false;
        lastOperation = null; // Reseteamos la operación guardada al añadir un operador nuevo
        isRepeatOperation = false;
    }
    let lastChar = display.textContent.at(-1);
    let timesMinus = display.textContent.slice(-2) == '×-' || display.textContent.slice(-2) == '÷-' ? true : false;
    if (lastChar == undefined || (lastChar == operator && operator != '%')) return;

    // Verifica si lastChar es un dígito (string)
    if (/[0-9]/.test(lastChar)) {
        display.textContent += operator;
    } 
    // Operador '+' o '-' es reemplazado por el nuevo operador
    else if (['+', '-'].includes(lastChar)) {
        if (timesMinus) {
            display.textContent = display.textContent.slice(0, -2) + operator;
        } else {
            display.textContent = display.textContent.slice(0, -1) + operator;
        }
    }
    // Operador '÷', '×' o '%' tiene reglas especiales
    else if (['÷', '×', '%'].includes(lastChar)) {
        if (operator == '%' && lastChar == '%') {
            display.textContent = '(' + display.textContent + ')%';
        } 
        else if (operator == '-') {
            display.textContent += operator;
        }
        else {
            display.textContent = display.textContent.slice(0, -1) + operator;
        }
    }
}

function clearAll(){
    display.textContent = '0';
    previousOperandDisplay.textContent = '';
    resultDisplayed = false;
    lastOperation = null; // Reseteamos la operación guardada
    isRepeatOperation = false;
}

function deleteDigit(){
    let content = display.textContent;
    if (content.length <= 1){
        display.textContent = '0';
    } else {
        display.textContent = content.slice(0, -1);
    }
    previousOperandDisplay.textContent = '';
    resultDisplayed = false;
    lastOperation = null; // Reseteamos la operación guardada
    isRepeatOperation = false;
    display.textContent = formatExpression(display.textContent);
}

function changeSign(){
    let content = display.textContent;
    
    // Si es '0', no hace nada
    if (content === '0') return;
    
    // Extrae el último número (puede estar entre paréntesis o no)
    // CORRECCIÓN: Se agregó (\.\d+)? en ambos lados para capturar decimales
    let lastNumberMatch = content.match(/(-?\d+(\.\d+)?|\(-\d+(\.\d+)?\))$/);
    if (!lastNumberMatch) return;
    
    let lastNumber = lastNumberMatch[0];
    let beforeLastNumber = content.slice(0, -lastNumber.length);
    let newLastNumber;
    
    // Caso 1: Si está entre paréntesis negativo: '(-124.5)' -> '124.5'
    if (lastNumber.startsWith('(-') && lastNumber.endsWith(')')) {
        newLastNumber = lastNumber.slice(2, -1); // elimina '(-' y ')'
    }
    // Caso 2: Si es negativo sin paréntesis: '-6.5' -> '6.5'
    else if (lastNumber.startsWith('-')) {
        newLastNumber = lastNumber.slice(1); // elimina '-'

        // Si lo que hay antes NO es un operador (es un número o cierre de paréntesis),
        // entonces el '-' que quitamos era un operador de resta.
        // Debemos reemplazarlo por una suma para mantener la lógica.
        // Ejemplo: '5-86' -> match '-86', before '5'. Resultado deseado '5+86'
        let lastCharBefore = beforeLastNumber.slice(-1);
        if (beforeLastNumber.length > 0 && !['+', '-', '×', '÷', '('].includes(lastCharBefore)) {
            beforeLastNumber += '+';
        }
    }
    // Caso 3: Si es positivo: '1.5' -> '(-1.5)'
    else {
        newLastNumber = '(-' + lastNumber + ')';
    }
    
    display.textContent = beforeLastNumber + newLastNumber;
}

// Verifica si la expresión contiene errores de sintaxis, cuenta el número de paréntesis abiertos y cerrados
function isInterpretable(expression){
    let openCount = 0;
    let closeCount = 0;

    for (let char of expression) {
        if (char === '(') openCount++;
        if (char === ')') closeCount++;
    }

    return openCount === closeCount;
}

function normalizeExpression(expression){
    let openCount = 0;
    let closeCount = 0;

    for (let char of expression) {
        if (char === '(') openCount++;
        if (char === ')') closeCount++;
    }

    let missingClosingParentheses = openCount - closeCount;
    
    // Agrega los paréntesis de cierre faltantes
    if (missingClosingParentheses > 0) {
        return expression + ')'.repeat(missingClosingParentheses);
    }
    
    return expression;
}

// Función principal recursiva
function solveExpression(expr) {
    // 1. Limpieza básica
    expr = expr.trim();

    // 2. Manejo de paréntesis envolventes: (5+5) -> 5+5
    // Solo si los paréntesis cubren TODA la expresión
    if (expr.startsWith('(') && expr.endsWith(')')) {
        // Verificamos si los paréntesis realmente son un par envolvente y no algo como (1+2)+(3+4)
        let depth = 0;
        let isWrapped = true;
        for (let i = 0; i < expr.length - 1; i++) {
            if (expr[i] === '(') depth++; 
            if (expr[i] === ')') depth--;
            if (depth === 0) {
                isWrapped = false;
                break;
            }
        }
        if (isWrapped) {
            return solveExpression(expr.slice(1, -1));
        }
    }

    // 3. Caso Base: Si es solo un número (positivo, negativo o decimal)
    // Regex: Inicio, opcional menos, dígitos, opcional decimal, fin.
    if (/^-?\d+(\.\d+)?$/.test(expr)) {
        return parseFloat(expr);
    }

    // 4. Nivel 1: Sumas y Restas (Menor jerarquía, se resuelven al final del árbol)
    // Buscamos el operador de derecha a izquierda para respetar la asociatividad
    let index = findOperatorIndex(expr, ['+', '-']);
    
    if (index !== -1) {
        let operator = expr[index];
        let left = expr.slice(0, index);
        let right = expr.slice(index + 1);

        // Lógica especial para Porcentajes de Suma/Resta (Ej: 10+10% o 10-9%)
        // Si la parte derecha es un número seguido inmediatamente de un % (ej: "10%")
        if (/^-?\d+(\.\d+)?%$/.test(right)) {
            let valLeft = solveExpression(left);
            let valRightPercent = parseFloat(right.slice(0, -1)); // Quitamos el %
            
            if (operator === '+') {
                return valLeft * (1 + valRightPercent / 100);
            } else {
                return valLeft * (1 - valRightPercent / 100);
            }
        }

        // Operación estándar (Ej: 2+2 o 10-9%5)
        // Nota: Si era 10-9%5, el "9%5" no cumple el regex anterior, así que entra aquí.
        return operator === '+' 
            ? solveExpression(left) + solveExpression(right)
            : solveExpression(left) - solveExpression(right);
    }

    // 5. Nivel 2: Multiplicación, División y Módulo
    index = findOperatorIndex(expr, ['×', '÷', '%']);
    
    if (index !== -1) {
        let operator = expr[index];
        let left = expr.slice(0, index);
        let right = expr.slice(index + 1);

        // Caso especial: Porcentaje Unario (Ej: 5% o 1%)
        // Si el operador es % y no hay nada a la derecha (o la derecha está vacía)
        if (operator === '%' && right.trim() === '') {
            return solveExpression(left) / 100;
        }

        let valLeft = solveExpression(left);
        let valRight = solveExpression(right);

        if (operator === '×') return valLeft * valRight;
        if (operator === '÷') return valLeft / valRight;
        if (operator === '%') return valLeft % valRight; // Módulo binario (5%2)
    }

    return parseFloat(expr);
}

// Función auxiliar para encontrar el operador principal fuera de paréntesis
function findOperatorIndex(expr, operators) {
    let depth = 0;
    // Iteramos de derecha a izquierda
    for (let i = expr.length - 1; i >= 0; i--) {
        let char = expr[i];

        if (char === ')') depth++;
        else if (char === '(') depth--;
        
        else if (depth === 0 && operators.includes(char)) {
            // Manejo especial para el signo negativo:
            // No debe ser un operador si es parte de un número negativo (ej: 5*-5)
            // Un '-' es operador si NO está al principio Y el caracter anterior no es otro operador
            if (char === '-') {
                if (i === 0) continue; // Es un número negativo al inicio
                let prevChar = expr[i - 1];
                if (['+', '-', '×', '÷', '%', '('].includes(prevChar)) continue; // Es signo negativo
            }
            return i;
        }
    }
    return -1;
}

function calculateResult(){
    if (display.textContent == NaN || display.textContent == Infinity || display.textContent == -Infinity) {
        return;
    }
    let expression = getCleanExpression(display.textContent);
    
    // Lógica de repetición de operación
    if (resultDisplayed && lastOperation) {
        // Si ya se mostró un resultado y presionamos igual de nuevo, usamos la operación guardada
        expression = display.textContent + lastOperation.operator + lastOperation.operand;
        isRepeatOperation = true;
    } else {
        // Es un cálculo normal, intentamos extraer la última operación para guardarla
        // Buscamos el último operador y el último número
        // Nota: Esta lógica es simplificada, funciona bien para operaciones binarias simples al final
        let match = expression.match(/([+\-×÷])(-?\d+(\.\d+)?)$/);
        if (match) {
            lastOperation = {
                operator: match[1],
                operand: match[2]
            };
        } else {
            lastOperation = null;
        }
        isRepeatOperation = false;
    }

    // Normalizar paréntesis si faltan
    if (!isInterpretable(expression)) {
        expression = normalizeExpression(expression);
    }

    try {
        let result = solveExpression(expression);
        if (result == expression) {
            // Evita mostrar el mismo número si no hubo cambio
            return;
        }
        // Redondear para evitar problemas de punto flotante
        result = parseFloat(result.toFixed(9)); 
        
        if (isRepeatOperation) {
            // Si es repetición, mostramos la operación completa en el historial pequeño
            previousOperandDisplay.textContent = expression; 
        } else {
            previousOperandDisplay.textContent = display.textContent;
        }
        
        display.textContent = formatExpression(result.toString());
        resultDisplayed = true;
    } catch (e) {
        display.textContent = "Error";
        console.error(e);
    }
}

// Obtiene el contenido del display sin comas para poder operarlo
function getCleanExpression() {
    return display.textContent.replace(/,/g, '');
}

// Formatea una expresión numérica añadiendo comas a los miles
function formatExpression(expression) {
    // Primero limpiamos por seguridad
    let clean = expression.replace(/,/g, '');
    
    // Regex compleja: Busca números (enteros o decimales) dentro del string
    // y aplica el formato solo a la parte entera
    return clean.replace(/(\d+)(\.?\d*)/g, (match, integerPart, decimalPart) => {
        // Añade comas cada 3 dígitos en la parte entera
        let formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return formattedInteger + decimalPart;
    });
}
