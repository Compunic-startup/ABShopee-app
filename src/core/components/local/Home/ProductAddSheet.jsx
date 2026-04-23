import React, { useState } from 'react'
import { View, Text, Image, TouchableOpacity } from 'react-native'
import { Portal, Modal, Divider } from 'react-native-paper'
import { ScaledSheet } from 'react-native-size-matters'
import color from '../../../utils/color'
import FONTS from '../../../utils/fonts'

export default function ProductBottomSheet({ visible, onClose, product }) {
  const [qty, setQty] = useState(1)

  if (!product) return null

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={styles.sheet}
      >
        {/* Header */}
        <View style={styles.header}>
          <Image source={product.image} style={styles.image} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.title}>{product.name}</Text>
            <Text style={styles.unit}>1 unit</Text>
          </View>
        </View>

        <Divider style={{ marginVertical: 12 }} />

        {/* Info */}
        <Text style={styles.info}>
          AUTOMATIC KEY DELIVERY INSTANTLY ON REGISTERED EMAIL & WHATSAPP AFTER CHECKOUT.
        </Text>

        <Text style={styles.sectionTitle}>Product Description</Text>
        <Text style={styles.desc}>Lorem ipsum dolor sit umus More..</Text>

        <Text style={styles.sectionTitle}>Activation Procedure</Text>
        <Text style={styles.desc}>Lorem ipsum dolor sit umus More..</Text>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.qtyBox}>
            <TouchableOpacity onPress={() => qty > 1 && setQty(qty - 1)}>
              <Text style={styles.qtyBtn}>−</Text>
            </TouchableOpacity>

            <Text style={styles.qty}>{qty}</Text>

            <TouchableOpacity onPress={() => setQty(qty + 1)}>
              <Text style={styles.qtyBtn}>+</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.addBtn}>
            <Text style={styles.addText}>
              Add item ₹{parseInt(product.price.replace('₹', '')) * qty}
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </Portal>
  )
}


const styles = ScaledSheet.create({
  sheet: {
    backgroundColor: '#fff',
    padding: '16@s',
    borderTopLeftRadius: '16@ms',
    borderTopRightRadius: '16@ms',
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: '30@vs',
  },

  image: {
    width: '50@s',
    height: '50@vs',
    borderRadius: '6@ms',
  },

  title: {
    fontSize: '13@ms',
    fontFamily: FONTS.Bold,
  },

  unit: {
    fontSize: '11@ms',
    color: color.primary,
  },

  info: {
    fontSize: '10@ms',
    color: '#777',
    marginBottom: '8@vs',
  },

  sectionTitle: {
    fontSize: '12@ms',
    fontFamily: FONTS.Bold,
    marginTop: '6@vs',
  },

  desc: {
    fontSize: '11@ms',
    color: '#666',
    marginBottom: '6@vs',
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: '10@vs',
  },

  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#8bcdff',
    borderRadius: '6@ms',
    paddingHorizontal: '12@s',
    height: '40@vs',
  },

  qtyBtn: {
    fontSize: '18@ms',
    color: color.primary,
    paddingHorizontal: '8@s',
  },

  qty: {
    fontSize: '14@ms',
    fontFamily: FONTS.Bold,
  },

  addBtn: {
    flex: 1,
    backgroundColor: '#0B77A7',
    height: '40@vs',
    marginLeft: '10@s',
    borderRadius: '6@ms',
    justifyContent: 'center',
    alignItems: 'center',
  },

  addText: {
    color: '#fff',
    fontSize: '13@ms',
    fontFamily: FONTS.Bold,
  },
})
