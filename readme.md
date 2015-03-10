gander
=========

```
Gander at my hooks, ye Mighty, and despair!
```

Gander, in its most basic form, wraps itself around functions to provide execution times. Times are provided in sub-milliseconds when the precision is available ([process.hrtime](http://nodejs.org/api/process.html#process_process_hrtime), [performance.now](https://developer.mozilla.org/en-US/docs/Web/API/Performance.now)) and milliseconds when not.  

Generally, though, gander exposes callbacks that are invoked before and after a function is called so that you can perform thorough investigations and/or mad science.  

Gander supports CommonJS/node.js and AMD/require.js imports. You can also use it in your web app via a normal `script` tag and it will add itself to the `window` object.  

[![build status](https://secure.travis-ci.org/mmaelzer/gander.png)](http://travis-ci.org/mmaelzer/gander)

Install
-------

```
npm install gander
```

-------------------------------------

Node.js Example
-----------------
```javascript
var gander = require('gander');
var fs = require('fs');

gander(fs, {
  name: 'fs',
  async: true,
  ignore: ['write', 'writeFile']
});

fs.readFile(__filename, function(err, data) {
  /* log messages:
   *  fs.open: 0.543ms
   *  fs.fstat: 0.301ms
   *  fs.read: 0.154ms
   *  fs.close: 0.086ms
   *  fs.readFile: 13.760ms
   */

  fs.writeFile(__filename + '.bak', data, function(err) {
    // Even though 'write' and 'writeFile' are ignored, underlying
    // method calls are logged since they're not ignored

    /* log messages
     *  fs.open: 0.364ms
     *  fs.close: 0.555ms
     */
  });
});
```

Require.js Example
------------------
```javascript
define(['gander', 'backbone'], function(gander, Backbone) {
  var MyView = Backbone.View.extend({
    events: {
      'click': 'logBoop'
    },

    constructor: function() {
      Backbone.View.apply(this, arguments);
      gander(this, {name: 'MyView', unique: true});
    },

    render: function() {
      this.$el.html('<div>This is a view</div>');
      return this;
    },

    logBoop: function() {
      console.log('boop');
    }
  });

  return MyView;
});

define(['views/myview'], function(MyView) {
  var view = new MyView();

  $('body').append(view.render().el);

  // MyView1.render: 0.109ms

  /*** click the view ***/

  // MyView1.logBoop: 0.287ms
});
```

Usage
--------------

### gander(object, [options])

Gander takes an object and wraps all keys and prototype methods so that `before` and `after` callbacks are available. By default, the `before` callback stores a start time. By default, the `after` callback retrieves the start time and logs the diff in time. These defaults make gander a nice way of doing timing tests.  

#### Options

* **name** `String` - The name of the object. This is for your convenience so you can keep track of what's going on.
* **unique** `Boolean` - If set to `true`, gander will add an integer to the end of the `name` in the cases where the name is reused by multiple instantiated objects.
* **async** `Boolean` - If set to `true`, gander will wrap callbacks where a callback is a function in the last argument position.
* **promise** `Boolean` - If set to `true`, gander will also wrap promises returned from methods on an object.
* **ignore** `Array.<String>` - Gander will ignore any function/method with a name in the `ignore` array.
* **before** `Function(name, method, arg1, arg2, ..., argn)` - Gander will call `before` immediately prior to calling the underlying function. After the `name` and `method` parameters is the complete set of parameters passed to the underlying function.
* **after:sync** `Function(name, method, arg1, arg2, ..., argn, returnValue)` - Gander will call `after` immediately after calling the underlying function. The function parameters are the same as `before` but now include the return value from the underlying function as the last argument.
* **after:async** `Function(name, method, arg1, arg2, ..., argn, callbackArg1, ..., callbackArgn)` - Gander will call `after` immediately prior to calling the underlying callback function. The function parameters to `after` are the same as `before` but now include the arguments to be passed to the underlying callback.
* **logger** `Function(name, method, timeInMs)` - If you wish to hook into a custom logger, pass in a function that will be called with the `name` of the object, the `method` being called, and the `timeInMs` it took to execute the function.

Before/After Example
--------------------
```javascript
var gander = require('gander');

var TestObject = function() {
  this.num = 1;
};

TestObject.prototype.increment = function(val) {
  this.num += val;
  return this.num;
};

var obj = new TestObject();

/**
 *  A horribly contrived example where in `before` we decrement `this.num` by the amount
 *  to be passed in by `val`. `increment` will then return `this.num` to its
 *  original value. The `after` function will then set things right by incrementing
 *  `this.num` by `val`.
 */
gander(obj, {
  name: 'testObject',
  before: function(name, method, val) {
    this.num -= val;
    console.log('before: this.num:', this.num);
  },
  after: function(name, method, val, returnValue) {
    this.num += val;
    console.log('after: this.num:', this.num);
  }
});

obj.increment(2);
console.log('obj.num:', obj.num);

// before: this.num: -1
// after: this.num: 3
// obj.num: 3
```


Logger Example
---------------
```javascript
var winston = require('winston');
var fs = require('fs');
var gander = require('gander');

gander(fs, {
  async: true,
  logger: function(name, method, timeInMs) {
    winston.info(name + '.' + method, timeInMs);
  }
});

fs.readFile(__filename, function(err, data) {
  /* log messages:
   * info: fs.open 0.491
   * info: fs.fstat 0.782
   * info: fs.read 0.147
   * info: fs.close 0.132
   * info: fs.readFile 16.468
   */
});
```

The MIT License
===============

Copyright (c) 2014 Michael Maelzer

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
