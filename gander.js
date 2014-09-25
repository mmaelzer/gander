(function() {
  
  /**
   *  @param {Object} object
   *  @param {Options} options
   *    @param {String=} name
   *    @param {Function=} before
   *    @param {Function=} after
   *    @param {Boolean=} async
   *    @param {Array.<String>} ignore
   *    @param {Boolean=} unique
   */
  function gander(object, options) {
    options = options || {};
    
    // The name of this object or an internally generated id
    var name = getName(options.name, options.unique);

    // The before/after functions to call
    var before = options.before || noop;
    var after = options.after || noop;

    // Handle async calls
    var async = options.async || false;

    // Methods to ignore
    var ignore = (options.ignore || []).concat('constructor');
    
    // If no before/after functions provided, default
    // to console.time/console.timeEnd
    if (!options.before && !options.after) {
      before = time;
      after = timeEnd;
    }

    // Get the prototype of the object
    var proto = Object.getPrototypeOf(object);
    // Parse object keys and prototype keys
    var keys = Object.keys(proto).concat(Object.keys(object));
    // Loop through keys, rebinding any functions not in `ignore`
    keys.forEach(function(key) {
      if (typeof object[key] === 'function' && ignore.indexOf(key) === -1) {
        var fn = object[key];
        object[key] = function() {
          
          var args = [];
          // https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#3-managing-arguments
          for (var i = 0; i < arguments.length; i++) {
            args.push(arguments[i]);
          }

          var fullArgs = [name, key].concat(args);
          before.apply(this, fullArgs);

          // Handle async calls if async option is set to `true`
          // and the last arg is a function
          var callback = tail(args);
          if (async && typeof callback === 'function') {
            args[args.length - 1] = function() {
              var callbackArgs = [];
              // https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#3-managing-arguments
              for (var i = 0; i < arguments.length; i++) {
                callbackArgs.push(arguments[i]);
              }

              after.apply(this, fullArgs.concat(callbackArgs));
              callback.apply(this, callbackArgs);
            };
            return fn.apply(this, args);
          } 
          // Handle sync calls
          else {
            var ret = fn.apply(this, args);
            after.apply(this, fullArgs.concat(ret));
            return ret;
          }
        };
      }
    });
  }

  function noop() {}

  /**
   *  Because in js, we have to implement tail/last over and over
   *  @param {Array.<*>} array
   *  @return {*}
   */
  function tail(array) {
    return array && array.length ? array[array.length - 1] : undefined;
  }

  function time() {
    var args = [];
    // https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#3-managing-arguments
    for (var i = 0; i < Math.min(arguments.length, 2); i++) {
      args.push(arguments[i]);
    }
    console.time(args.join('.'));
  }

  function timeEnd() {
    var args = [];
    // https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#3-managing-arguments
    for (var i = 0; i < Math.min(arguments.length, 2); i++) {
      args.push(arguments[i]);
    }
    console.timeEnd(args.join('.'));
  }

  var counter = 0;
  /** 
   *  @param {String=} opt_name
   *  @param {Boolean=} opt_unique
   *  @return {String} 
   */
  function getName(opt_name, opt_unique) {
    if (opt_name) {
      return opt_unique ? (opt_name + (++counter)) : opt_name;
    } else {
      return 'o' + (++counter);  
    }    
  }

  // CommonJS/node.js support
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = gander;
    }
    exports.gander = gander;
  } else {
    // No module loader
    this.gander = gander;
  }

  // AMD/Require.js support
  if (typeof define === 'function' && define.amd) {
    define('gander', [], function() {
      return gander;
    });
  }
}).call(this);

