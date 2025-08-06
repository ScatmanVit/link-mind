import { Text, View, TextInput, StyleSheet, TextInputProps } from "react-native"
import { colors } from '@/styles/colors';
// importar lib de icons

export type Input = TextInputProps & {
   placeholder?: string
   size?: number,
   label?: string,
} // depois estender uma lib de icons, para colocar dentro do input

export default function Input({placeholder, label, size, ...rest}: Input) {
   return (
      <View style={s.container}>
         <Text style={[s.label, { fontSize: size}]}>
            {label}
         </Text>
         <TextInput 
            style={[s.input, { fontSize: size}]} 
            placeholder={placeholder} 
            placeholderTextColor={colors.gray[100]}
            {...rest} // depois estender uma lib de icons, para colocar dentro do input
         />
      </View>
   )
}

const s = StyleSheet.create({
  container: {
    gap: 15,
    width: '100%', 
  },
  label: {
    fontSize: 22,
  },
  input: {
    fontSize: 20,
    borderRadius: 14,
    backgroundColor: colors.gray[400],
    padding: 16,
    width: "100%", 
  },
});