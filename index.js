var acornToEsprima = require("./acorn-to-esprima");
var traverse       = require("babel").traverse;
var extend         = require("lodash/object/extend");
var Module         = require("module");
var acorn          = require("babel").acorn;
var t              = require("babel").types;

var hasPatched = false;

function monkeypatch() {
  if (hasPatched) return;
  hasPatched = true;

  // monkeypatch estraverse
  var estraverse = require("estraverse");
  extend(estraverse.VisitorKeys, t.VISITOR_KEYS);

  // monkeypatch escope
  var escope = require("eslint/node_modules/escope");
  var analyze = escope.analyze;
  escope.analyze = function (ast, opts) {
    opts.ecmaVersion = 6;
    opts.sourceType = "module";
    return analyze.call(this, ast, opts)
  };
}

exports.parse = function (code) {
  monkeypatch();

  var opts = {};
  opts.ecmaVersion = 7;
  opts.locations = true;
  opts.playground = true;
  opts.ranges = true;

  var comments = opts.onComment = [];
  var tokens = opts.onToken = [];

  var ast = acorn.parse(code, opts);

  // convert tokens
  ast.tokens = tokens.map(acornToEsprima.toToken);

  // add comments
  ast.comments = comments;

  // transform esprima and acorn divergent nodes
  acornToEsprima.toAST(ast);

  return ast;
};
