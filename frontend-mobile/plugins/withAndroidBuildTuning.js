const { withGradleProperties } = require('@expo/config-plugins');

const GRADLE_PROPERTIES = {
  'org.gradle.parallel': 'false',
  'org.gradle.workers.max': '2',
  reactNativeArchitectures: 'arm64-v8a',
};

module.exports = function withAndroidBuildTuning(config) {
  return withGradleProperties(config, (config) => {
    for (const [key, value] of Object.entries(GRADLE_PROPERTIES)) {
      const existing = config.modResults.find(
        (item) => item.type === 'property' && item.key === key
      );
      if (existing) {
        existing.value = value;
      } else {
        config.modResults.push({ type: 'property', key, value });
      }
    }
    return config;
  });
};
