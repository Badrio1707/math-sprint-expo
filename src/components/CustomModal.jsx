import { KeyboardAvoidingView, Modal, Platform, View } from 'react-native';

const CustomModal = ({ isOpen, withInput, children, ...rest }) => {

  const Wrapper = withInput ? KeyboardAvoidingView : View;

  return (
    <Modal 
      visible={isOpen}
      transparent
      animationType='fade'
      statusBarTranslucent
      {...rest}
    >
      <Wrapper
        className='flex-1 justify-center items-center px-5'
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        {...(withInput && {
          behavior: Platform.OS === 'ios' ? 'padding' : 'height'
        })}
      >
        {children}
      </Wrapper>
    </Modal>
  )
}

export default CustomModal