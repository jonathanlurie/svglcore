const es6module = require("..");

var foo = new es6module.Foo(20, 30);

// do something with foo
foo.printAnAttribute();
foo.setAnAttribute(34)
foo.printAnAttribute();
