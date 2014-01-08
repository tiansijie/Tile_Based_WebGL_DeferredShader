(function(exports) {
    "use strict";
   /*global window*/

    exports = exports || window;

    ///////////////////////////////////////////////////////////////////////////
    // Shim from http://paulirish.com/2011/requestanimationframe-for-smart-animating/
    
    exports.requestAnimFrame = 
        window.requestAnimationFrame       || 
        window.webkitRequestAnimationFrame || 
        window.mozRequestAnimationFrame    || 
        window.oRequestAnimationFrame      || 
        window.msRequestAnimationFrame     || 
        function( callback ){
            window.setTimeout(callback, 1000 / 60);
        };

    ///////////////////////////////////////////////////////////////////////////
    // getShader based on http://learningwebgl.com/cookbook/index.php/Loading_shaders_from_HTML_script_tags
    
    exports.getShaderSource = function(script) {
        var str = "";
        var k = script.firstChild;
        while (k) {
            if (k.nodeType == 3) {
                str += k.textContent;
            }
            k = k.nextSibling;
        }
    
        return str;
    };

    ///////////////////////////////////////////////////////////////////////////

    exports.createWebGLContext = function(canvas, message) {
        if (!window.WebGLRenderingContext) {
            message.innerText = "The browser does not support WebGL.  Visit http://get.webgl.org.";
            return undefined;
        }
        var options = { alpha: false };        
        var context = canvas.getContext("experimental-webgl", options);
    
        if (!context && message) {
            message.innerText = "The browser supports WebGL, but initialization failed.";
        }
        
        return context;
    };

    exports.createProgram = function(context, vertexShaderSource, fragmentShaderSource, message) {
        var program = context.createProgram();
        var vs = context.createShader(context.VERTEX_SHADER);
        var fs = context.createShader(context.FRAGMENT_SHADER);
        
        context.attachShader(program, vs);
        context.attachShader(program, fs);
        
        // Mark shader for deletion when the program is deleted
        context.deleteShader(vs);
        context.deleteShader(fs);

        context.shaderSource(vs, vertexShaderSource);
        context.compileShader(vs);
        if (!context.getShaderParameter(vs, context.COMPILE_STATUS)) {
            if (message) {
                message.innerText += context.getShaderInfoLog(vs) + "\n";
                alert(context.getShaderInfoLog(vs));
            }
            else
            {
                alert(context.getShaderInfoLog(vs));
            }
            context.deleteProgram(program);
            return;
        }

        context.shaderSource(fs, fragmentShaderSource);
        context.compileShader(fs);
        if (!context.getShaderParameter(fs, context.COMPILE_STATUS)) {
            if (message) {
                message.innerText += context.getShaderInfoLog(fs) + "\n";
                alert(context.getShaderInfoLog(fs));
            }
            else
            {
                alert(context.getShaderInfoLog(fs));
            }
            context.deleteProgram(program);
            return;
        }
        
        context.linkProgram(program);
        if (!context.getProgramParameter(program, context.LINK_STATUS)) {
            if (message) {
                message.innerText += context.getProgramInfoLog(program) + "\n";
                alert(context.getShaderInfoLog(program));
            }
            else
            {
                alert(context.getShaderInfoLog(program));
            }
            context.deleteProgram(program);
            return;
        }
        
        return program;
    };

}());
