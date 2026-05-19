import { StrokeText } from '@charmy.tech/react-native-stroke-text';

const fontSizes = {
  'xs': 12,
  'sm': 14,
  'base': 16,
  'lg': 18,
  'xl': 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '6xl': 60,
  '7xl': 72,
};

const fontFamily = {
  'black' : 'Nunito-Black',
  'bold' : 'Nunito-Bold',
  'extraBold' : 'Nunito-ExtraBold',
  'light' : 'Nunito-Light',
  'medium' : 'Nunito-Medium',
  'regular' : 'Nunito-Regular',
  'semiBold' : 'Nunito-SemiBold',
}

export default function CustomText({ text, family = 'Nunito-Regular', size = 'base', rasio = 0.15 }) {
  const selectedFontSize = fontSizes[size] || fontSizes['base'];
  const selectedFontFamily = fontFamily[family] || fontSizes['base'];
  const fontWeight = size * rasio

  return (
    <StrokeText
      text={text}
      fontSize={selectedFontSize}
      color="#FF0000"
      strokeColor="#000000"
      strokeWidth={fontWeight}
      fontFamily={selectedFontFamily}
    />
  );
}