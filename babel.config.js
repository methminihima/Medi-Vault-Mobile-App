module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src',
            '@components': './components',
            '@constants': './constants',
            '@hooks': './hooks',
            '@assets': './assets',
            '@api': './src/api',
            '@services': './src/services',
            '@contexts': './src/contexts',
            '@utils': './src/utils',
            '@config': './src/config',
            '@types': './src/types',
            '@store': './src/store',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
