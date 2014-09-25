var test = require('tape');
var gander = require('./gander');

test('gander', function(t) {
  t.plan(11);

  var obj = new TestObject();
  gander(obj, { 
    name: 'object1', 
    before: function(name, method, arg1) {
      t.equal(name, 'object1', 'before() should pass object name as first arg');
      t.equal(method, 'jump', 'before() should pass method name as second arg');
      t.equal(arg1, 5, 'before() should pass arguments as third and following args');
    },
    after: function(name, method, arg1, retValue) {      
      t.equal(name, 'object1', 'after() should pass object name as first arg');
      t.equal(method, 'jump', 'after() should pass method name as second arg');
      t.equal(arg1, 5, 'after() should pass arguments as third and following args');
      t.equal(retValue, 10, 'after() should pass the return value as the last arg');
    }
  });
  obj.jump(5);

  var obj2 = new TestObject();
  obj2.val = 3;
  obj2.triple = function() {};
  gander(obj2, {
    name: 'object2',
    before: function(name, method) {
      if (method === 'triple') {
        this.val = this.val * this.val * this.val;
      }
    },
    ignore: ['triple']
  });
  obj2.triple();
  t.equal(obj2.val, 3, 'the `ignore` option should provide a list of methods to not wrap with gander');

  var obj3 = { fooAsync: fooAsync };

  gander(obj3, {name: 'object3', async: true, after: function(name, method, callback, foo) {
    t.equal('foo', foo, 'the `async` option should call `after` after the async operation completes');
  }});

  obj3.fooAsync(noop);

  var obj4 = { fooAsync: fooAsync };

  gander(obj4, {name: 'object4', after: function(name, method, callback, bar) {
    t.equal('bar', bar, 'not setting `async` should call `after` with the return value of the async function');
  }});

  obj4.fooAsync(noop);

  var obj5 = { identity: identity };
  var obj6 = { identity: identity };

  gander(obj5, { name: 'obj', unique: true});
  gander(obj6, { name: 'obj', unique: true, before: function(name) {
    t.equal(name, 'obj2', 'the `unique` option with a `name` should provide a uniquely numbered name');
  }});

  obj6.identity(-1);

});

// Helpers

function identity(val) {
  return val;
}

function noop() {}

function fooAsync(callback) {
  setTimeout(function() {
    callback('foo');
  }, 500);
  return 'bar';
}

// Test Object definition

function TestObject() {}

TestObject.prototype.after = function(name, method, var_args) {
  var args = [];
  for (var i = 2; i < arguments.length; i++) {
    args.push(arguments[i]);
  }
  switch(method) {
    case 'jump':
      console.log('I jumped from', args[0], 'to', args[1]);
      break;
  }
};

TestObject.prototype.jump = function(height) {
  return height * 2;
};