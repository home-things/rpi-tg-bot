module.exports = {
  extends: 'airbnb-base',
  rules: {
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