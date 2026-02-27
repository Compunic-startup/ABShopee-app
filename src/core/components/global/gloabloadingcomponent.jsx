import React, { useState } from 'react'
import { Button } from 'react-native-paper'

export default function AppButton({
  children,
  onPress,
  disabled,
  ...props
}) {
  const [loading, setLoading] = useState(false)

  const handlePress = async () => {
    if (!onPress) return

    try {
      setLoading(true)
      await onPress()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      {...props}
      loading={loading}
      disabled={loading || disabled}
      onPress={handlePress}
    >
      {children}
    </Button>
  )
}
