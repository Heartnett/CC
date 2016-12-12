(function() {
  
    "use strict";

    var regex = /\[{2}(.+?)\]{2}/g;

    function CC(template) {
        var specialValues = checkForSpecialValue(template);
        return function compile(data) {
            return interpolator(data, template, specialValues);
        };
    };

    function checkForSpecialValue(template) {
        var result = {
            indexDetected: false,
            itemDetected: false,
            valueDetected: false
        };
        var match = undefined;
        var re = new RegExp(regex)
        while((match = re.exec(template)) !== null) {
            if(match.index === re.lastIndex) re.lastIndex++;
            if(/\$value/g.test(match[1]))  {
                result.valueDetected = true;
                break;
            }
            if(/\$index/g.test(match[1])) result.indexDetected = true;
            if(/\$item/g.test(match[1])) result.itemDetected = true;
            if(result.indexDetected && result.itemDetected) break; 
        }
        return result;
    }

    function interpolator(data, template, specialValues) {
        var items = Array.isArray(data) ? data : [data];
        var expression = undefined;
        var result = items.map(function(item, index) {
            expression = interpolateSpecialValues(template, specialValues, item, index);
            return runExpression(item, expression);
        });
        return (result.length === 1 ? result[0] : result);
    };

    function interpolateSpecialValues(template, specialValues, object, index) {
        var transformed = template;
        if(specialValues.valueDetected) {
            return interpolateSpecialValue(/\$value/g, transformed, object);
        }
        if(specialValues.itemDetected) {
            transformed = interpolateSpecialValue(/\$item/g, transformed, object);
        }
        if(specialValues.indexDetected) {
            transformed = interpolateSpecialValue(/\$index/g, transformed, index);
        }
        return transformed;
    }

    function interpolateSpecialValue(re, template, value) {
        var match = undefined; var matches = [];
        var compiled = template; var re1 = new RegExp(regex);
        var isObject = false;
        var replacementValue = typeof value === "string" ? 
            "'" + value + "'" : 
            (isObject = typeof value === "object") ? 
                JSON.stringify(value) : 
                value;

        while((match = re1.exec(compiled)) !== null) {
            if(re.test(match[1])) {
                if(match[1].indexOf(".") === -1 && isObject) replacementValue = "'" + replacementValue + "'";
                compiled = compiled.replace(match[1], match[1].replace(re, replacementValue));
            }
        }
        return compiled;
    }

    function runExpression(ctx, expression, hasSpecialValues) {
        with(ctx) {
            return eval("'" + expressionify(expression) + "';")
        }
    }

    function expressionify(template) {
        return template.replace(/\[{2}/g, "' + (").replace(/\]{2}/g, ") + '");
    }

    window.CC = CC;

})();
