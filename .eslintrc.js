module.exports = {
  extends: 'airbnb-base',
  env: {
    'browser': true,
    'commonjs': true,
    'node': true,
    'es6': true
  },
  parser: 'babel-eslint',
  parserOptions: {
    'ecmaVersion': 6,
    'ecmaFeatures': {
      'experimentalObjectRestSpread': true,
      'experimentalDecorators': true,
      'experimentalOptionalChaining': true,
    },
    'sourceType': 'module'
  },
  rules: {
    'prefer-arrow-callback': ['off'],
    'no-unused-vars': ['warn'],
    'max-len': ['warn', 120],
    'no-underscore-dangle': ['off'],
    'no-plusplus': ['off'],
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'arrow-parens': ['warn'],
    'global-require': ['off'],
    'no-confusing-arrow': ['off'],
    'no-shadow': ['warn'],
    'template-curly-spacing': ['warn', 'always'],
    'arrow-body-style': ['off'],
    'prefer-template': ['warn'],
    'no-use-before-define': ['error', { 'variables': true, 'functions': false, 'classes': false }],
  },
};