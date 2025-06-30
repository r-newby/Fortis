// src/components/common/ProgressBar.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../utils/colors';

const ProgressBar = ({ progress = 0, height = 4, style }) => {
  return (
    <View style={[styles.container, { height }, style]}>
      <View 
        style={[
          styles.fill, 
          { 
            width: `${Math.min(100, Math.max(0, progress))}%`,
            height 
          }
        ]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
});

export default ProgressBar;