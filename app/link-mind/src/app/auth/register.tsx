import { Text, View, StyleSheet } from 'react-native'
import Input from '@/components/input'

export default function Register(){

   const inputs = [
      {placeholder: "Nome", label: "Nome"},
      {placeholder: "Email", label: "Email"}
   ]

   return (
      <View style={s.container}>
         {inputs.map((input, index) => (
            <View style={s.inputWrapper}>
               <Input key={index} placeholder={input.placeholder} label={input.label} />
            </View>
         ))}
      </View>
   )
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center", 
    alignItems: "center",     
    gap: 43,
    paddingHorizontal: 20,    
  },
  inputWrapper: {
    width: 340,               
  }
});