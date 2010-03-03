
/**
 * constant function ($const : a -> b -> a)
 *
 * @param x constant input value to return when lambda function is called
 * @return function returning input value to $const when being called
 */
function $const(x) { 
    return function () { 
        return x; 
    }; 
}

/**
 * id function ($id : a -> a)
 *
 * @param x value to be returned
 * @return input value
 */
function $id(x) { 
    return x; 
}

/**
 * test if value is defined
 *
 * @param x any value
 * @return true if input is not undefined
 */
function $defined(x) {
    return x !== undefined;
}

/**
 * test if value is null
 *
 * @param x value to test if null
 * @return true if input value is null
 */
function isNull(x) {
    return x === null;
}

/**
 * $A create a new array by iterating over input values.
 */
function $A(iterable) {
	if (iterable.item) {
		var l = iterable.length, array = new Array(l);
		while ((l--) > 0) {
            array[l] = iterable[l];
        }
		return array;
	}
	return Array.prototype.slice.call(iterable);
}


/**
 * $not creates the complement of a function returning a boolean value
 * ($not : (a -> bool) -> (a -> bool)
 *
 * @param f function 
 * @return returns complement of input function
 */
function $not(f) { 
    return function (x) { 
        return !f(x); 
    }; 
}

/**
 * $and creates a test function by forming a conjunction of the list of input
 * predicates. ($and : [a -> bool] -> (a -> bool))
 *
 * @param pred... variable number of predicates
 * @return a new function testing its input with the given predicates.
 *         If every predicate returns true the result will be true. The returned
 *         function fails on the first failing predicate.
 */
function $and(/* fns... */) {
    var fns = $A(arguments);
    return function (x) {
        for (var i = 0; i < fns.length; i++) {
            if (!fns[i](x)) { 
                return false; 
            }
        }
        return true;
    };
}

/**
 * $or creates a test function by forming a disjunction of the list of input
 * predicates. ($or : [a -> bool] -> (a -> bool))
 *
 * @param pred... variable number of predicates
 * @return a new function testing its input with the given predicates.
 *         Only if every predicate returns false the result will be false. The returned
 *         function returns true on the first non-failing predicate.
 */
function $or(/* fns... */) {
    var fns = $A(arguments);
    return function (x) {
        for (var i = 0; i < fns.length; i++) {
            if (fns[i](x)) { 
                return true; 
            }
        }
        return false;
    };
}

/**
 * $compose creates a new function by composing its input functions.
 * for example $compose(f,g)(x) == f(g(x))
 *
 * @param fn... variable number of input functions
 * @return new function by composing input functions right to left
 */
function $compose(/* fns... */) {
    var fns = $A(arguments.length === 1 && arguments[0] instanceof 'array'  ? 
                   arguments[0] : arguments).map($const);

    var len = fns.length;
    return function (/*arguments...*/) {
        var args = $A(arguments);
        for (var i = len - 1; i >= 0; i--) {
            args = [fns[i].apply(this, args)];
        }
        return args[0];
    };
}

/**
 * $sequence composes the list of given functions from left to right instead
 * right to left as $compose does.
 *
 * @param fn... variable number of input functions
 * @return new function by composing input functions left to right
 */
function $sequence(/*fns... */) {
    return $compose(arguments.reverse());
}

/**
 * $flip flips the input parameters of a binary function. 
 * ($flip : (a ** b -> c) -> (b ** a -> c)
 *
 * @param fn binary input function
 * @return function with swapped input parameters
 */
function $flip(fn) {
    return function (a, b) {
        return fn(b, a);
    };
}

/**
 * $curryBind returns a partial function and binds the function with optional
 * parameters to a given object/environment.
 *
 * @param fn      input function
 * @param bind    object/environment fn is bound to
 * @param args... list of parameters applied so far
 *
 * @return new function bound to 'bind' and partially applied to given
 *         arguments
 */
function $curryBind(fn, bind /*, args... */ ) {
    var args = $A(arguments).slice(2);
    return function () {
        fn.apply(bind, args.concat(arguments.slice(0)));
    };
}

/**
 * $curry returns a partially applied function to given arguments.
 *
 * @param fn      input function
 * @param args... list of parameters to apply
 * @return partially applied function
 */
function $curry(fn /*, args... */ ) {
    var args = $A(arguments).slice(1);
    return function () {
        var a = args.concat($A(arguments).slice(0));
        return fn.apply(this, a);
    };
}

/**
 * $rcurry return a partially applied function to given arguments from the
 * right.
 *
 * @param fn      input function
 * @param args... list of parameters to apply
 * @return partially applied function
 */
function $rcurry(fn /*, args... */ ) {
    var args = Array.slice(arguments, 1);
    return function () {
        var a = Array.slice(arguments, 0).concat(args);
        return fn.apply(this, a);
    };
}

/**
 * map returns new function with the given function applied to the result of
 * this function.
 */
Function.prototype.map = function (fn) { 
    return $compose(fn, this); 
};

Function.prototype.curry = function () { 
    var args = $A(arguments);
    var fn = this;
    return function () {
        var a = args.concat($A(arguments).slice(0));
        return fn.apply(fn, a);
    };
};

Function.prototype.rcurry = function () {
    var args = Array.slice(arguments, 0);
    var fn = this;
    return function () {
        var a = Array.slice(arguments, 0).concat(args);
        return fn.apply(this, a);
    };
};

Function.prototype.flip = function () { 
    return $flip(this); 
};

/**
 * arrayFn lifts an array or dictionary into a partial function which will
 * return the arrays/dictionaries value for the given input.
 *
 * @param arr array or dictionary
 * @return new function returning a[i] when called with i
 */
function arrayFn(arr) {
    return function (i) {
        return arr[i];
    };
}

/**
 * $aref lifts an index (or key if dictionaries are to be used) to a function
 * which will return the arrays value at initial index.
 *
 * @param i index into arrays
 */
function $aref(i) {
    return function (arr) {
        return arr[i];
    };
}

/**
 * left fold over elements in array
 *
 * @param fn     binary iterator for left fold
 * @param [init] optional starting value. If not given the array its first
 *               value will be used
 */
Array.prototype.foldl = function (fn, init) {
    var val = init || null;
    for (var i = 0; i < this.length; i++) {
        val = fn(val, this[i]);
    }
    return val;
};

/**
 * right fold over elements in array
 *
 * @param fn     binary iterator for left fold
 * @param [init] optional starting value. If not given the array its first
 *               value will be used
 */
Array.prototype.foldr = function (fn, init) {
    var val = init || null;
    for (var i = this.length; i-- ;) {
        val = fn(val, this[i]);
    }
    return val;
};

if(undefined === Array.prototype.indexOf && undefined === Array.indexOf) {

    /**
     * indexOf finds the index of an element in the Array or -1 if element was not found.
     * The search element is compared using ===.
     *
     * @param x element to find index for
     * @param [j] optional starting parameter
     *
     * @return index of element or -1 of element is not Array
     */
    Array.prototype.indexOf = function (x, j) {
        var i = arguments.length > 1 ? j : 0;
        for (; i < this.length; i++) {
            if (x === this[i]) {
                return i;
            }
        }
        return -1;
    }
}

/**
 * creates new Array of intersection of the current and the given array.
 * The elements in both Arrays are compared using the strict equality comparator ===.
 *
 * @param {Array} arr Array to compute intersection with current array with.
 *
 * @return new Array with all elements present in this and given Array.
 */
Array.prototype.intersection = function (arr) {
    if (arr === this) {
        return $A(this);
    }

    var i, tmp = [], 
    for (i = 0; i < this.length; i++) {
        if (0 <= arr.indexOf(this[i])) {
            tmp.push(this[i]);
        }
    }

    return this;
};

Array.prototype.union = function (arr) {
    var i, tmp = new Array(this.length);

    // copy this into tmp
    for (i = 0; i < this.length; i++) {
        tmp[i] = this[i];
    }

    // copy elements of are not found in this to tmp
    for (i = 0; i < arr.length; i++) {
        if (-1 === this.indexOf(arr[i])) {
            tmp.push(arr[i]);
        }
    }

    return tmp;
}

/**
 * $field returns a value from key value path of a given object.
 * <br/><br/>
 * given an object 'obj' and a key 'path' $field(obj, path) returns obj[path].
 * But 'path' may contain full object path (separated by dot) and $field will
 * return the value at the path. For every Array in the path an array is created
 * with the values of the remaining path. <br/><br/>
 * for example
 * <p>
 *   var person = { name: ...,
 *                  adress: { street: ...
 *                            city: 'Hometown' } };
 *
 *   $field(person, 'address.city') // -> 'Hometown'
 *
 *   var db = { persons: [ { name: 'Person 1',
 *                           address: { street: ...,
 *                                      city: 'City 1'}},
 *                         { name: 'Person 2',
 *                           address: {street; ...,
 *                                     city: 'City 2'}}]}
 *   $field(db, 'persons.address.city') // -> ['City 1', 'City 2']
 *
 * </p>
 * <br/>
 *
 * @param [obj] optional object. If not set a function is returned which will
 *              retrieve the values key.
 * @param fieldName path into object. Array in the path will be mapped over.
 *
 * @return a function if only a key value path is given which will retrieve the
 *         value of a given object at a later moment. If object is given the
 *         value at the given path.
 */
function $field(obj, fieldName) {
    if (arguments.length === 1) {
        var fn = obj;
        return function (obj) {
            return $field(obj, fn);
        };
    } else {
        var names = fieldName.split('.');
        var cur = obj;
        for (var i = 0; i < names.length && cur; i++) {
            if (cur instanceof Array) {
                cur = cur.map(function (c) { 
                                  return c[names[i]]; 
                              }).filter($not(isNull));
            } else {
                cur = cur[names[i]];
            }
        }
        return cur;
    }
}

/**
 * zip n arrays  using an n-ary function.
 *
 * @param fn n-ary function to be applied to each element at the same index in
 *           each input array
 * @param arrays... input arrays to zip
 */
function zip(fn) {
    var as = $A(arguments);
    as.splice(0, 1);
    var len = as.foldl(function(len, arr){ 
                            return Math.min(len, arr.length); 
                       }, as[0].length);
    var arr = new Array(len);

    for(var i=0; i < len; i++) {
        arr[i] = fn.apply(this, as.map(function (a) { 
                                           return a[i]; 
                                       }));
    }
    return arr;
}

/**
 * $setText sets inner text of a given DOM element (needs mootools)
 */
function $setText(obj) { 
    return function (txt) { 
        obj.set('text', txt); 
    }; 
} 

/**
 * $getText returns inner text of a given DOM element
 */
function $getText(obj) { 
    return obj.innerText || obj.textContent; 
}

/**
 * $setText sets inner html of a given DOM element (needs mootools)
 */
function $setHTML(obj) { 
    return function (txt) { 
        obj.set('html', txt); 
    }; 
}

