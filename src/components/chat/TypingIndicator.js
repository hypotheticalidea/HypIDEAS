import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { APP_CONFIG } from '../../constants/config';

const TypingIndicator = ({ users = [] }) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateTyping = () => {
      const duration = 400;
      const delay = 200;

      Animated.loop(
        Animated.sequence([
          Animated.timing(dot1, { toValue: 1, duration, useNativeDriver: true }),
          Animated.timing(dot1, { toValue: 0, duration, useNativeDriver: true }),
          Animated.delay(delay),
        ])
      ).start();

      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(dot2, { toValue: 1, duration, useNativeDriver: true }),
            Animated.timing(dot2, { toValue: 0, duration, useNativeDriver: true }),
            Animated.delay(delay),
          ])
        ).start();
      }, delay);

      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(dot3, { toValue: 1, duration, useNativeDriver: true }),
            Animated.timing(dot3, { toValue: 0, duration, useNativeDriver: true }),
            Animated.delay(delay),
          ])
        ).start();
      }, delay * 2);
    };

    animateTyping();
  }, []);

  const getTypingText = () => {
    if (users.length === 0) return '';
    if (users.length === 1) return `${users[0].name} is typing`;
    if (users.length === 2) return `${users[0].name} and ${users[1].name} are typing`;
    return `${users[0].name} and ${users.length - 1} others are typing`;
  };

  if (users.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <Text style={styles.text}>{getTypingText()}</Text>
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, { opacity: dot1 }]} />
          <Animated.View style={[styles.dot, { opacity: dot2 }]} />
          <Animated.View style={[styles.dot, { opacity: dot3 }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_CONFIG.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: APP_CONFIG.colors.border,
  },
  text: {
    fontSize: 14,
    color: APP_CONFIG.colors.textSecondary,
    fontStyle: 'italic',
    marginRight: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: APP_CONFIG.colors.textSecondary,
    marginHorizontal: 1,
  },
});

export default TypingIndicator;
