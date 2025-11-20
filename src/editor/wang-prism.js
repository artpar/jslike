// Wang Language Definition for Prism.js
/* global Prism */
(function (Prism) {
  Prism.languages.wang = {
    // Comments
    comment: [
      {
        pattern: /\/\*[\s\S]*?\*\//,
        greedy: true,
      },
      {
        pattern: /\/\/.*/,
        greedy: true,
      },
    ],

    // Template literals with interpolation
    'template-string': {
      pattern: /`(?:\\[\s\S]|\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}|(?!\$\{)[^\\`])*`/,
      greedy: true,
      inside: {
        'template-punctuation': {
          pattern: /^`|`$/,
          alias: 'string',
        },
        interpolation: {
          pattern: /((?:^|[^\\])(?:\\{2})*)\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}/,
          lookbehind: true,
          inside: {
            'interpolation-punctuation': {
              pattern: /^\$\{|\}$/,
              alias: 'punctuation',
            },
            rest: Prism.languages.wang,
          },
        },
        string: /[\s\S]+/,
      },
    },

    // Strings
    string: [
      {
        pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
        greedy: true,
      },
    ],

    // Regular expressions
    regex: {
      pattern: /\/(?:\\.|[^\/\\\r\n])+\/[gimsuy]*/,
      greedy: true,
      inside: {
        'regex-delimiter': {
          pattern: /^\/|\/[gimsuy]*$/,
          alias: 'punctuation',
        },
        'regex-flags': {
          pattern: /[gimsuy]+$/,
          alias: 'keyword',
        },
      },
    },

    // Keywords
    keyword:
      /\b(?:let|const|var|if|else|for|while|do|break|continue|return|function|class|extends|constructor|async|await|import|export|from|as|try|catch|finally|throw|new|this|super|typeof|instanceof|in|of)\b/,

    // Boolean and null values
    boolean: /\b(?:true|false)\b/,
    null: /\b(?:null|undefined)\b/,

    // Numbers
    number: /\b(?:0x[\dA-Fa-f]+|0b[01]+|0o[0-7]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/,

    // Arrow function operator
    'arrow-operator': {
      pattern: /=>/,
      alias: 'operator',
    },

    // Operators (order matters for matching)
    operator:
      /\+\+|--|===|!==|==|!=|<=|>=|<<|>>>|>>|&&|\|\||[?]{2}|\?\.|\.{3}|\*\*|\+=|-=|\*=|\/=|[+\-*/%<>&|^~!?:]=?/,

    // Punctuation
    punctuation: /[{}[\];(),.:]/,

    // Functions (pattern for function calls)
    function: /\b[a-zA-Z_$][\w$]*(?=\s*\()/,

    // Class names (after class or extends)
    'class-name': {
      pattern: /(\b(?:class|extends)\s+)[a-zA-Z_$][\w$]*/,
      lookbehind: true,
    },

    // Property names in object literals
    property: {
      pattern:
        /((?:^|[,{])[ \t]*)(?:(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*|"(?:\\.|[^\\"\r\n])*"|'(?:\\.|[^\\'\r\n])*')(?=\s*:)/m,
      lookbehind: true,
      greedy: true,
    },

    // Variables and identifiers (must come last)
    variable: /\b[a-zA-Z_$][\w$]*/,
  };

  // Set wang as an alias for javascript-like highlighting
  Prism.languages.wang['class-name'].pattern = /(\b(?:class|extends|new)\s+)[a-zA-Z_$][\w$]*/;

  // Hook to handle special Wang syntax
  Prism.hooks.add('before-tokenize', function (env) {
    if (env.language !== 'wang') {
      return;
    }
  });

  // Hook to add special classes for Wang-specific features
  Prism.hooks.add('wrap', function (env) {
    if (env.language !== 'wang') {
      return;
    }

    // Add special class for Wang keywords
    if (env.type === 'keyword' && ['import', 'export', 'from', 'as'].includes(env.content)) {
      env.classes.push('wang-module');
    }
  });
})(Prism);

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Prism.languages.wang;
}
