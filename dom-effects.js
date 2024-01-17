/**
 * THIS IS PoC Version which means:
 * - No JIT compilation
 * - Simple/Dirty Code
 * - Not many features
 * - Not production ready
 * - Probably buggy as hell
 * 
 * Expected expresion syntax is
 * {eventName}({eventParameters}):{effect}({effectParameters})
 */

(function () {


window.DOM_EFFECTS_VERSION = "0.1:PoC";

function traverseDomTreeWithCallbacks(node, callback) {
    if ( callback ) callback(node);
    for ( const child of Array.from(node.childNodes) ) {
        traverseDomTreeWithCallbacks(child, callback);
    }
}

class ExpressionString {
    constructor(eventName="", eventParameters="", effect="", effectParameters="") {
        Object.assign(this, {eventName, eventParameters, effect, effectParameters})
    }
}

function isALetter(str) {
    return str.toUpperCase() != str.toLowerCase() 
}

function isADigit(str) {
    return /^\d+$/.test(str);
}

function parserError(ptr, effectScript) {
    let err = new Error();
    err.message = `Unexpected char at ${ptr} in \n|\n|\t${effectScript}` + `\n|\t` + "^".padStart(ptr+1);
    err.name = "DomEffectsParserError"
    return err
}

function parseParamsStringToArray(str) {
    const ParserStates = {
        NOT_PARSING: 0,
        PARSING_NUMBER: 2,
        PARSING_STRING: 4,
    }
    let parserState = ParserStates.NOT_PARSING;
    let ptr=0;
    let buffer="";
    let parsedParams = []

    while ( ptr < str.length ) {
        let char = str[ptr++];
        switch (parserState) {
            case ParserStates.NOT_PARSING:
                if ( char == "," || char == " " ) continue;
                else if ( isADigit(char) ) {
                    parserState = ParserStates.PARSING_NUMBER;
                    buffer += char;
                }
                else if ( char == `"` ) parserState = ParserStates.PARSING_STRING;
                else throw parserError(ptr-1, `(${str})`)
                break;
            case ParserStates.PARSING_NUMBER:
                if ( !isADigit(char) ) {
                    if ( char == " " || char == "," ) {
                        parserState = ParserStates.NOT_PARSING
                        parsedParams.push(Number(buffer));
                        buffer="";
                        continue;
                    }

                    throw parserError(ptr-1, `(${str})`)
                } 
                buffer += char;
                break;
            case ParserStates.PARSING_STRING:
                if ( char == `"` ) {
                    parserState = ParserStates.NOT_PARSING;
                    parsedParams.push(buffer);
                    buffer="";
                    continue;
                }
                buffer+=char;
                break;
            default:
                throw parserError(ptr-1, `(${str})`)
                break;
        }
    }

    return parsedParams;
}


function compileDomEffectOnNode(node, effectScript) {
    // console.log("Compiling", effectScript, "at", node)
    let ptr = 0;
    let isParsingStringExpression = false;

    let parsedExpressions = [];
    const ParserStates = {
        NOT_PARSING:        0,
        EVENT_NAME:         2,
        EVENT_PARAMS:       4,
        EVENT_PARAMS_END:   8,
        EFFECT:             16,
        EFFECT_PARAMS:      32,
    }

    let parserState = ParserStates.NOT_PARSING;

    while ( ptr < effectScript.length ) {
        let char = effectScript[ptr++];
        switch ( parserState ) {
            case ParserStates.NOT_PARSING:
                if ( !isALetter(char) ) {
                    if ( char != " " ) throw parserError(ptr-1, effectScript);
                    continue;
                }
                parserState = ParserStates.EVENT_NAME;
                parsedExpressions.push(new ExpressionString());
                parsedExpressions.at(-1).eventName += char;
                break;
            case ParserStates.EVENT_NAME:
                if ( !isALetter(char) ) {
                    if ( char == "(" ) {
                        parserState = ParserStates.EVENT_PARAMS;
                        continue;
                    } else if ( char == ":" ) {
                        parserState = ParserStates.EFFECT;
                        continue;
                    }

                    throw parserError(ptr-1, effectScript);
                };
                parsedExpressions.at(-1).eventName += char;
                break;
            case ParserStates.EVENT_PARAMS:
                if ( !isALetter(char) ) {
                    if ( char == `"` ) {
                        isParsingStringExpression = !isParsingStringExpression;
                    }

                    if ( char == ")" && !isParsingStringExpression) {
                        parserState = ParserStates.EVENT_PARAMS_END;
                        continue;
                    } 
                };
                parsedExpressions.at(-1).effectParameters += char;
                break;
            case ParserStates.EVENT_PARAMS_END:
                if ( char == ":" ) parserState = ParserStates.EFFECT;
                break;
            case ParserStates.EFFECT:
                if ( !isALetter(char) ) {
                    if ( char == "(" ) {
                        parserState = ParserStates.EFFECT_PARAMS;
                        continue;
                    } 
                    throw parserError(ptr-1, effectScript);
                };
                parsedExpressions.at(-1).effect += char;
                break;
            case ParserStates.EFFECT_PARAMS:
                if ( !isALetter(char) ) {
                    if ( char == `"` ) {
                        isParsingStringExpression = !isParsingStringExpression;
                    }

                    if ( char == ")" && !isParsingStringExpression ) {
                        parserState = ParserStates.NOT_PARSING;
                        continue;
                    } 
                };
                parsedExpressions.at(-1).eventParameters += char;
                break;
            default:
                throw parserError(ptr-1, effectScript);
        }
    }

    if ( parserState != ParserStates.NOT_PARSING ) {
        throw parserError(ptr, effectScript);
    }

    for ( const parsedExpression of parsedExpressions ) {
        parsedExpression.effectParameters = parseParamsStringToArray(parsedExpression.effectParameters);
        parsedExpression.eventParameters = parseParamsStringToArray(parsedExpression.eventParameters);
        if ( ReversableEventDefinitions[parsedExpression.eventName] ) {

            let effect = parsedExpression.effect;
            let reversedEffect = ReversedEffects[effect]

            if ( !reversedEffect ) {
                throw EffectError(`${effect} is not easily reversable!`)
            } 

            
            const event = ReversableEventDefinitions[parsedExpression.eventName];
            node.addEventListener( event.domEvent, (e) => {
                if ( BuiltInEffects[effect] instanceof Function ) {
                    BuiltInEffects[
                        effect
                    ]( parsedExpression.eventParameters, e.target );
                } else if ( window[effect] instanceof Function ) {
                    window[
                        effect
                    ]( parsedExpression.eventParameters, e.target );
                } 
            })

            node.addEventListener( event.counterDomEvent, (e) => {
                if ( BuiltInEffects[reversedEffect] instanceof Function ) {
                    BuiltInEffects[
                        reversedEffect
                    ]( parsedExpression.eventParameters, e.target );
                } else if ( window[reversedEffect] instanceof Function ) {
                    window[
                        reversedEffect
                    ]( parsedExpression.eventParameters, e.target );
                } 
            })
        } else {
            node.addEventListener(parsedExpression.eventName, (e) => {
                if ( BuiltInEffects[parsedExpression.effect] instanceof Function ) {
                    BuiltInEffects[
                        parsedExpression.effect
                    ]( parsedExpression.eventParameters, e.target );
                } else if ( window[parsedExpression.effect] instanceof Function ) {
                    window[
                        parsedExpression.effect
                    ]( parsedExpression.eventParameters, e.target );
                } 
            })
        }
    }
}

function EffectError(message) {
    const err = new Error();
    err.name = "DomEffectError";
    err.message = message;
    return err;
}

const ReversableEventDefinitions = {
    "hover": {
        domEvent: "mouseenter",
        counterDomEvent: "mouseleave",
    }
}

const BuiltInEffects = {
    // addClass(params, target) {
    //     const [ className ] = params;
    //     target.classList.add(className)
    // },

    // removeClass(params, target) {
    //     const [ className ] = params;
    //     target.classList.remove(className)
    // },

    setStyle(params, target) {
        const [ key, value ] = params;
        target.style[key] = value;
    }
}

const ReversedEffects = {
    // "addClass": "removeClass",
    // "removeClass": "addClass",
}

// outside public interface
class DomEffects {
    constructor() {}
    init() { initialize() }

    registerReversableEffect(behaviour, reverseBehaviour) {
        if ( !(behaviour instanceof Function) || !(reverseBehaviour instanceof Function)) {
            throw "`behaviour` and `reverseBehaviour` parameters should be instances of a function";
        }

        ReversedEffects[behaviour.name] = reverseBehaviour.name;
        ReversedEffects[reverseBehaviour.name] = behaviour.name;

    }
}

const domEffects = new DomEffects();
window.DomEffects = domEffects;

function initialize() {
    traverseDomTreeWithCallbacks(document.body, (node) => {
        if ( node?.dataset?.domEffect ) compileDomEffectOnNode(node, node?.dataset?.domEffect)
    })
}
})();
