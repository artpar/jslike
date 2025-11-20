// AST Node Constructors

export const Program = (body) => ({
  type: 'Program',
  body
});

export const Literal = (value) => ({
  type: 'Literal',
  value
});

export const Identifier = (name) => ({
  type: 'Identifier',
  name
});

export const BinaryExpression = (operator, left, right) => ({
  type: 'BinaryExpression',
  operator,
  left,
  right
});

export const UnaryExpression = (operator, argument, prefix = true) => ({
  type: 'UnaryExpression',
  operator,
  argument,
  prefix
});

export const UpdateExpression = (operator, argument, prefix = true) => ({
  type: 'UpdateExpression',
  operator,
  argument,
  prefix
});

export const AssignmentExpression = (operator, left, right) => ({
  type: 'AssignmentExpression',
  operator,
  left,
  right
});

export const LogicalExpression = (operator, left, right) => ({
  type: 'LogicalExpression',
  operator,
  left,
  right
});

export const ConditionalExpression = (test, consequent, alternate) => ({
  type: 'ConditionalExpression',
  test,
  consequent,
  alternate
});

export const CallExpression = (callee, args) => ({
  type: 'CallExpression',
  callee,
  arguments: args
});

export const MemberExpression = (object, property, computed = false) => ({
  type: 'MemberExpression',
  object,
  property,
  computed
});

export const ArrayExpression = (elements) => ({
  type: 'ArrayExpression',
  elements
});

export const ObjectExpression = (properties) => ({
  type: 'ObjectExpression',
  properties
});

export const Property = (key, value, shorthand = false) => ({
  type: 'Property',
  key,
  value,
  shorthand
});

export const FunctionExpression = (id, params, body) => ({
  type: 'FunctionExpression',
  id,
  params,
  body
});

export const ArrowFunctionExpression = (params, body, expression = false) => ({
  type: 'ArrowFunctionExpression',
  params,
  body,
  expression
});

export const VariableDeclaration = (kind, declarations) => ({
  type: 'VariableDeclaration',
  kind,
  declarations
});

export const VariableDeclarator = (id, init = null) => ({
  type: 'VariableDeclarator',
  id,
  init
});

export const FunctionDeclaration = (id, params, body) => ({
  type: 'FunctionDeclaration',
  id,
  params,
  body
});

export const BlockStatement = (body) => ({
  type: 'BlockStatement',
  body
});

export const ExpressionStatement = (expression) => ({
  type: 'ExpressionStatement',
  expression
});

export const ReturnStatement = (argument = null) => ({
  type: 'ReturnStatement',
  argument
});

export const IfStatement = (test, consequent, alternate = null) => ({
  type: 'IfStatement',
  test,
  consequent,
  alternate
});

export const WhileStatement = (test, body) => ({
  type: 'WhileStatement',
  test,
  body
});

export const DoWhileStatement = (body, test) => ({
  type: 'DoWhileStatement',
  body,
  test
});

export const ForStatement = (init, test, update, body) => ({
  type: 'ForStatement',
  init,
  test,
  update,
  body
});

export const ForInStatement = (left, right, body) => ({
  type: 'ForInStatement',
  left,
  right,
  body
});

export const ForOfStatement = (left, right, body) => ({
  type: 'ForOfStatement',
  left,
  right,
  body
});

export const BreakStatement = (label = null) => ({
  type: 'BreakStatement',
  label
});

export const ContinueStatement = (label = null) => ({
  type: 'ContinueStatement',
  label
});

export const ThrowStatement = (argument) => ({
  type: 'ThrowStatement',
  argument
});

export const TryStatement = (block, handler = null, finalizer = null) => ({
  type: 'TryStatement',
  block,
  handler,
  finalizer
});

export const CatchClause = (param, body) => ({
  type: 'CatchClause',
  param,
  body
});

export const SwitchStatement = (discriminant, cases) => ({
  type: 'SwitchStatement',
  discriminant,
  cases
});

export const SwitchCase = (test, consequent) => ({
  type: 'SwitchCase',
  test,
  consequent
});

export const NewExpression = (callee, args) => ({
  type: 'NewExpression',
  callee,
  arguments: args
});

export const ThisExpression = () => ({
  type: 'ThisExpression'
});

export const SequenceExpression = (expressions) => ({
  type: 'SequenceExpression',
  expressions
});

export const EmptyStatement = () => ({
  type: 'EmptyStatement'
});
