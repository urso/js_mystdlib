
/**
 * @namespace 
 *
 * Minimal Aspect Oriented Programming library for JavaScript.
 *
 */
var AOP = new function () {
        
        /**
         * constant error object thrown when input object to AOP functions is in fact no object
         * @constant 
         */
        this.InvalidObject  = new Error("unable to add aop function to non-object");

        /**
         * constant error object thrown when method to be changed by AOP does not exist
         * @constant 
         */
        this.InvalidMethod  = new Error("unknown method");

        /**
         * constant error object thrown when function to be joined in is in fact no function
         * @constant 
         */
        this.InvalidAspect  = new Error("can only add functions");

        this.InvalidProceed = new Error("you can not call proceed from here");
        
        /** @private */
        function check(obj, method, fun) {
            if (typeof obj !== 'object')              throw AOP.InvalidObject;
            if (typeof fun !== 'function')            throw AOP.InvalidAspect;
            if (!method || obj[method] === undefined) throw AOP.InvalidMethod;
        }
        
        /**
         * before inserts a function 'before' the objects method when method is called.
         *
         * @param {Object}   object object to add after method to
         * @param {String}   name name of objects method
         * @param {Function} function function to be run before the original method is called.
         *                   If function returns another value then 'undefined' its return
         *                   value will be send to the original method
         * @return old method
         */
        this.before = function (obj, method, fun) {
            check(obj, method, fun);
            
            var old = obj[method];
            obj[method] = function () {
                var tmp = fun.apply(this, arguments);
                if (tmp === undefined)         return old.apply(this, arguments);
                else if (tmp instanceof Array) return old.apply(this, tmp);
                else                           return old.apply(this, [tmp]);
            };
            return old;
        };
        
        /**
         * after inserts a function after the objects method.
         *
         * The given function will be called with the methods return value
         * and its return value returned to the callee then.
         *
         *
         * @param {Object}   object object to add after method to
         * @param {String}   name name of objects method
         * @param {Function} function function to be run after the method was called.
         * @return old method
         */
        this.after = function (obj, method, fun) {
            check(obj, method, fun);
            
            var old = obj[method];
            obj[method] = function () {
                var tmp = old.apply(this, arguments);
                return fun.apply(this, [tmp]);
            };
            return old;
        };
        
        /**
         * handle adds a function being called on exceptions to the said method.
         *
         * @param {Object}   object object to add handler method
         * @param {String}   name name of objects method
         * @param {Function} function function to be called when an exception was thrown
         * @return old method
         */
        this.handle = function (obj, method, fun) {
            check(obj, method, fun);
            
            var old = obj[method];
            obj[method] = function () {
                try {
                    old.apply(this, arguments);
                } catch (e) {
                    fun.apply(this, new Array(e, arguments));
                }
            };
            return old;
        }
        
        /**
         * around replaces the method with the given function, but when called also passes
         * the original method as first parameter to the replacing function.
         *
         * @param {Object}   object object to add handler method
         * @param {String}   name name of objects method
         * @param {Function} function function the method is replaced with.
         * @return old method
         */
        this.around = function(obj, method, fun) {
            check(obj, method, fun);
            
            var old = obj[method];
            obj[method] = function () {
                return fun.apply(this, Array(old, arguments));
            }
            return old;
        }

        return this;
};

