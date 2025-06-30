// src/components/common/Card.js
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../utils/colors';
import { spacing } from '../../utils/spacing';

const Card = ({
  children,
  style,
  onPress,
  disabled = false,
  variant = 'default',
}) => {
  const CardWrapper = onPress ? TouchableOpacity : View;
  
  return (
    <CardWrapper
      style={[
        styles.card,
        variant === 'surface' && styles.surfaceCard,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
    >
      {children}
    </CardWrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  surfaceCard: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: 'transparent',
  },
});

export default Card;