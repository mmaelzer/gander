(function() {

  /** @type {Boolean} **/
  var isNode = typeof module !== 'undefined' && module.exports;

  /**
   *  @param {Object} object
   *  @param {Options} options
   *    @param {String=} name
   *    @param {Function=} before
   *    @param {Function=} after
   *    @param {Boolean=} async
   *    @param {Array.<String>} ignore
   *    @param {Boolean=} unique
   *
   *  @public
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

  /** Just a good ole noop function **/
  function noop() {}

  /**
   *  Because in js, we have to implement tail/last over and over
   *  @param {Array.<*>} array
   *  @return {*}
   */
  function tail(array) {
    return array && array.length ? array[array.length - 1] : undefined;
  }

  /**
   *  Cache to be used to hold function start times
   *  @type {Object}
   */
  var _times = {};

  /** @type {Boolean} **/
  var _hasHrTime = false;
  if (isNode) {
    _hasHrTime = process && typeof process.hrtime === 'function';
  }

  /** @type {Boolean} **/
  var _hasPerfNow = this.performance && typeof this.performance.now === 'function';

  /** @type {Boolean} **/
  var _hasDateNow = typeof Date.now === 'function';

  /** 
   *  process.hrtime returns a number array, otherwise the return is a number
   *  @return {Number|Array.<Number>} 
   */
  function now() {
    if (_hasHrTime) return process.hrtime();
    if (_hasPerfNow) return performance.now();
    if (_hasDateNow) return Date.now();
    return new Date().getTime();
  }

  /**
   *  Handle hrtime values or stanard numeric times
   *  @param {Number|Array<Number>} time
   *  @return {Number}
   */
  function getMs(time) {
    var digits = 3;
    if (_hasHrTime) {
      var diff = process.hrtime(time);
      return ((diff[0]*1000) + (diff[1]/1000000)).toFixed(digits);
    }
    return (now() - time).toFixed(digits);
  }

  function time() {
    var args = [];
    // https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#3-managing-arguments
    for (var i = 0; i < Math.min(arguments.length, 2); i++) {
      args.push(arguments[i]);
    }

    var key = args.join('.');
    _times[key] = now();
  }

  function timeEnd() {
    var args = [];
    // https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#3-managing-arguments
    for (var i = 0; i < Math.min(arguments.length, 2); i++) {
      args.push(arguments[i]);
    }

    var key = args.join('.');
    var ms = getMs(_times[key]);
    delete _times[key];
    console.log(key + ':', ms + 'ms');
  }

  /** 
   *  Internal counter for object instances 
   *  @type {Number} 
   */
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
    if (isNode) {
      exports = module.exports = gander;
    }
    exports.gander = gander;
  } else {
    // No module loader
    this.gander = gander;
  }

  // AMD/Require.js support
  if (typeof define === 'function' && define.amd) {
    define([], function() {
      return gander;
    });
  }
}).call(this);

