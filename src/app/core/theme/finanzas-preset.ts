import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

/**
 * Aura retinted to the app surface ramp so tables, inputs, dialogs and tags
 * sit on the same planes as the hand-written shell instead of fighting it.
 */
export const FinanzasPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '#eef2ff',
            100: '#e0e7ff',
            200: '#c7d2fe',
            300: '#a5b4fc',
            400: '#818cf8',
            500: '#6366f1',
            600: '#4f46e5',
            700: '#4338ca',
            800: '#3730a3',
            900: '#312e81',
            950: '#1e1b4b'
        },
        colorScheme: {
            light: {
                surface: {
                    0: '#ffffff',
                    50: '#f7f9fc',
                    100: '#eef1f7',
                    200: '#e4e9f2',
                    300: '#d5dcea',
                    400: '#a8b3c9',
                    500: '#7b879f',
                    600: '#5c6880',
                    700: '#445066',
                    800: '#2b3752',
                    900: '#1e283f',
                    950: '#141b2e'
                },
                primary: {
                    color: '#4f46e5',
                    contrastColor: '#ffffff',
                    hoverColor: '#4338ca',
                    activeColor: '#3730a3'
                },
                highlight: {
                    background: '#eef2ff',
                    focusBackground: '#e0e7ff',
                    color: '#4338ca',
                    focusColor: '#3730a3'
                },
                mask: {
                    background: 'rgba(15, 23, 42, 0.42)',
                    color: '#0f1729'
                },
                formField: {
                    background: '#ffffff',
                    disabledBackground: '#f2f4f8',
                    filledBackground: '#f7f9fc',
                    filledHoverBackground: '#eef1f7',
                    filledFocusBackground: '#ffffff',
                    borderColor: '#dde3ee',
                    hoverBorderColor: '#c6cfe0',
                    focusBorderColor: '#4f46e5',
                    invalidBorderColor: '#be123c',
                    color: '#0f1729',
                    disabledColor: '#8d99b0',
                    placeholderColor: '#5f6c85',
                    invalidPlaceholderColor: '#8a6470'
                }
            },
            dark: {
                surface: {
                    0: '#ffffff',
                    50: '#eef2f9',
                    100: '#dbe2ee',
                    200: '#c3cce0',
                    300: '#94a1bd',
                    400: '#6b7896',
                    500: '#4a5670',
                    600: '#3a4864',
                    700: '#2b3752',
                    800: '#1e283f',
                    900: '#0d1424',
                    950: '#070b14'
                },
                primary: {
                    color: '#6366f1',
                    contrastColor: '#ffffff',
                    hoverColor: '#7c7ff3',
                    activeColor: '#4f46e5'
                },
                highlight: {
                    background: '#232b52',
                    focusBackground: '#2c3663',
                    color: '#b4bcff',
                    focusColor: '#c7d2fe'
                },
                mask: {
                    background: 'rgba(3, 6, 15, 0.62)',
                    color: '#eef2f9'
                },
                formField: {
                    background: '#151d31',
                    disabledBackground: '#1e283f',
                    filledBackground: '#1a2338',
                    filledHoverBackground: '#212c45',
                    filledFocusBackground: '#151d31',
                    borderColor: '#2b3752',
                    hoverBorderColor: '#3a4864',
                    focusBorderColor: '#6366f1',
                    invalidBorderColor: '#fb7185',
                    color: '#eef2f9',
                    disabledColor: '#6b7896',
                    placeholderColor: '#8592ac',
                    invalidPlaceholderColor: '#b8808d'
                }
            }
        }
    }
});