module.exports = {
  '*.{js,jsx,ts,tsx}': [
    'bash -c "ESLINT_USE_FLAT_CONFIG=false eslint --fix $@" --',
    'prettier --write',
  ],
  '*.{json,md,mdx,css,scss}': ['prettier --write'],
};
