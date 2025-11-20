// Wang Language Definition for Monaco Editor
export const wangLanguage = {
  defaultToken: 'invalid',
  tokenPostfix: '.wang',

  keywords: [
    'let',
    'const',
    'var',
    'if',
    'else',
    'for',
    'while',
    'do',
    'break',
    'continue',
    'return',
    'function',
    'class',
    'extends',
    'constructor',
    'async',
    'await',
    'import',
    'export',
    'from',
    'as',
    'try',
    'catch',
    'finally',
    'throw',
    'this',
    'super',
    'new',
    'typeof',
    'instanceof',
    'in',
    'of',
  ],

  typeKeywords: [],

  operators: [
    '=>',
    '+=',
    '-=',
    '*=',
    '/=',
    '===',
    '!==',
    '==',
    '!=',
    '<=',
    '>=',
    '<<',
    '>>',
    '>>>',
    '&&',
    '||',
    '??',
    '?.',
    '...',
    '++',
    '--',
    '**',
    '+',
    '-',
    '*',
    '/',
    '%',
    '&',
    '|',
    '^',
    '~',
    '!',
    '?',
    ':',
    '=',
    '<',
    '>',
  ],

  symbols: /[=><!~?:&|+\-*\/\^%]+/,

  escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

  tokenizer: {
    root: [
      // Identifiers and keywords
      [
        /[a-zA-Z_$][\w$]*/,
        {
          cases: {
            '@keywords': 'keyword',
            'true|false|null|undefined': 'constant',
            '@default': 'identifier',
          },
        },
      ],

      // Whitespace
      { include: '@whitespace' },

      // Delimiters and operators
      [/[{}()\[\]]/, '@brackets'],
      [/[<>](?!@symbols)/, '@brackets'],
      [
        /@symbols/,
        {
          cases: {
            '@operators': 'operator',
            '@default': '',
          },
        },
      ],

      // Numbers
      [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
      [/0[xX][0-9a-fA-F]+/, 'number.hex'],
      [/\d+/, 'number'],

      // Delimiter
      [/[;,.]/, 'delimiter'],

      // Strings
      [/"([^"\\]|\\.)*$/, 'string.invalid'],
      [/'([^'\\]|\\.)*$/, 'string.invalid'],
      [/"/, 'string', '@string_double'],
      [/'/, 'string', '@string_single'],

      // Template literals
      [/`/, 'string.template', '@template'],

      // Regular expressions
      [/\/(?=([^\/\\]|\\.)+\/)/, 'regexp', '@regexp'],
    ],

    whitespace: [
      [/[ \t\r\n]+/, ''],
      [/\/\*/, 'comment', '@comment'],
      [/\/\/.*$/, 'comment'],
    ],

    comment: [
      [/[^\/*]+/, 'comment'],
      [/\*\//, 'comment', '@pop'],
      [/[\/*]/, 'comment'],
    ],

    string_double: [
      [/[^\\"]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, 'string', '@pop'],
    ],

    string_single: [
      [/[^\\']+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/'/, 'string', '@pop'],
    ],

    template: [
      [/[^`\\$]+/, 'string.template'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/\${/, { token: 'delimiter.bracket', next: '@templateExpression' }],
      [/`/, 'string.template', '@pop'],
    ],

    templateExpression: [[/}/, { token: 'delimiter.bracket', next: '@pop' }], { include: 'root' }],

    regexp: [
      [
        /(\{)(\d+(?:,\d*)?)(\})/,
        ['regexp.escape.control', 'regexp.escape.control', 'regexp.escape.control'],
      ],
      [/(\[)([^\]\\]|\\.)*(\])/, 'regexp.escape.control'],
      [/(\()(\?:|\?=|\?!)/, ['regexp.escape.control', 'regexp.escape.control']],
      [/[()]/, 'regexp.escape.control'],
      [/@escapes/, 'regexp.escape'],
      [/\\./, 'regexp.escape'],
      [/\/[gimsuy]*/, { token: 'regexp', bracket: '@close', next: '@pop' }],
      [/./, 'regexp'],
    ],
  },
};

// Register the language with Monaco
export function registerWangLanguage(monaco) {
  monaco.languages.register({ id: 'wang' });
  monaco.languages.setMonarchTokensProvider('wang', wangLanguage);

  // Configuration for brackets and auto-closing
  monaco.languages.setLanguageConfiguration('wang', {
    comments: {
      lineComment: '//',
      blockComment: ['/*', '*/'],
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"', notIn: ['string'] },
      { open: "'", close: "'", notIn: ['string'] },
      { open: '`', close: '`', notIn: ['string'] },
      { open: '/*', close: '*/' },
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
      { open: '`', close: '`' },
    ],
    folding: {
      markers: {
        start: new RegExp('^\\s*//\\s*#?region\\b'),
        end: new RegExp('^\\s*//\\s*#?endregion\\b'),
      },
    },
    indentationRules: {
      increaseIndentPattern: new RegExp('^.*(\\{[^}]*|\\([^)]*|\\[[^\\]]*)$'),
      decreaseIndentPattern: new RegExp('^\\s*(\\}|\\)|\\])'),
    },
  });
}
