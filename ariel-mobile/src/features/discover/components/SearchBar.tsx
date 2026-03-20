import React, { useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING } from '@/shared/constants/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
  editable?: boolean;
  onPress?: () => void;
}

export function SearchBar({
  value,
  onChangeText,
  onClear,
  onFocus,
  onBlur,
  autoFocus = false,
  placeholder = 'Cards, subjects, topics…',
  editable = true,
  onPress,
}: SearchBarProps): React.ReactElement {
  const inputRef = useRef<TextInput>(null);

  return (
    <TouchableOpacity
      activeOpacity={editable ? 1 : 0.7}
      onPress={onPress}
      style={styles.container}
    >
      {/* Search icon */}
      <View style={styles.iconLeft}>
        <SearchIcon />
      </View>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        autoFocus={autoFocus}
        placeholder={placeholder}
        placeholderTextColor="#52525b"
        style={styles.input}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="never"
        editable={editable}
        pointerEvents={editable ? 'auto' : 'none'}
      />

      {/* Clear button — only shown when there's text */}
      {value.length > 0 && (
        <TouchableOpacity
          onPress={onClear}
          style={styles.clearButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ClearIcon />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

// ─── SVG-style icons as View-based shapes ────────────────────────────────────

function SearchIcon() {
  return (
    // Minimalist search lens: circle + handle stub drawn with Views
    <View style={iconStyles.searchWrapper}>
      <View style={iconStyles.searchCircle} />
      <View style={iconStyles.searchHandle} />
    </View>
  );
}

function ClearIcon() {
  return (
    <View style={iconStyles.clearCircle}>
      {/* X drawn with two rotated bars */}
      <View style={[iconStyles.xBar, { transform: [{ rotate: '45deg' }] }]} />
      <View style={[iconStyles.xBar, { transform: [{ rotate: '-45deg' }] }]} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 44,
  },
  iconLeft: {
    marginRight: SPACING.sm,
    opacity: 0.5,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
    paddingVertical: 0,
  },
  clearButton: {
    marginLeft: SPACING.sm,
  },
});

const iconStyles = StyleSheet.create({
  searchWrapper: {
    width: 16,
    height: 16,
    position: 'relative',
  },
  searchCircle: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.textSecondary,
    backgroundColor: 'transparent',
  },
  searchHandle: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 2,
    height: 6,
    borderRadius: 1,
    backgroundColor: COLORS.textSecondary,
    transform: [{ rotate: '-45deg' }],
  },
  clearCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xBar: {
    position: 'absolute',
    width: 10,
    height: 2,
    borderRadius: 1,
    backgroundColor: COLORS.textSecondary,
  },
});
