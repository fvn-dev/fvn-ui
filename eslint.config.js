export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    rules: {
      // Ternary formatting - operator at start of line with proper indentation
      'multiline-ternary': ['error', 'always-multiline'],
      'operator-linebreak': ['error', 'before'],
      'indent': ['error', 2, { 
        SwitchCase: 1,
        flatTernaryExpressions: false,
        offsetTernaryExpressions: true
      }],
      
      // General code quality
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'prefer-const': ['warn', { destructuring: 'all' }]
    }
  },
  {
    ignores: ['dist/**', 'node_modules/**']
  }
]
