import React, { useRef, useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native'
import { ScaledSheet, ms, vs, s } from 'react-native-size-matters'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import color from '../../../utils/color'

const { width: SCREEN_W } = Dimensions.get('window')


// ─── Sparkle Particle ────────────────────────────────────────────────────────
function Sparkle({ x, y, size, color: col, delay }) {
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const run = () => {
      anim.setValue(0)
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 900 + Math.random() * 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => run())
    }
    run()
  }, [])

  const opacity = anim.interpolate({ inputRange: [0, 0.3, 0.7, 1], outputRange: [0, 1, 1, 0] })
  const scale = anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.2, 1.4, 0.2] })
  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] })

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        opacity,
        transform: [{ scale }, { rotate }],
      }}
    >
      <Text style={{ fontSize: size, color: col }}>✦</Text>
    </Animated.View>
  )
}

// ─── Firework burst ───────────────────────────────────────────────────────────
function Firework({ x, y, delay, colors }) {
  const particles = Array.from({ length: 8 }, (_, i) => i)
  const anims = useRef(particles.map(() => new Animated.Value(0))).current
  const masterAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const run = () => {
      masterAnim.setValue(0)
      anims.forEach(a => a.setValue(0))
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(masterAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          ...anims.map(a =>
            Animated.timing(a, {
              toValue: 1,
              duration: 700,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            })
          ),
        ]),
        Animated.delay(1500 + Math.random() * 1000),
      ]).start(() => run())
    }
    run()
  }, [])

  const masterOpacity = masterAnim.interpolate({
    inputRange: [0, 0.2, 0.7, 1],
    outputRange: [0, 1, 1, 0],
  })

  return (
    <Animated.View style={{ position: 'absolute', left: x, top: y, opacity: masterOpacity }}>
      {particles.map((_, i) => {
        const angle = (i / particles.length) * Math.PI * 2
        const dist = anims[i].interpolate({ inputRange: [0, 1], outputRange: [0, 22] })
        const tx = dist.interpolate({
          inputRange: [0, 22],
          outputRange: [0, Math.cos(angle) * 22],
        })
        const ty = dist.interpolate({
          inputRange: [0, 22],
          outputRange: [0, Math.sin(angle) * 22],
        })
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              transform: [{ translateX: tx }, { translateY: ty }],
            }}
          >
            <View
              style={{
                width: 4,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors[i % colors.length],
              }}
            />
          </Animated.View>
        )
      })}
    </Animated.View>
  )
}

// ─── Confetti piece ───────────────────────────────────────────────────────────
function Confetti({ x, col, delay, shape }) {
  const anim = useRef(new Animated.Value(0)).current
  const rotateAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 2200 + Math.random() * 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.delay(500),
      ])
    ).start()

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start()
  }, [])

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-10, 140] })
  const translateX = anim.interpolate({
    inputRange: [0, 0.3, 0.6, 1],
    outputRange: [x, x + 8, x - 6, x + 4],
  })
  const opacity = anim.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 1, 0] })
  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })

  const size = 5 + Math.random() * 4
  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        opacity,
        transform: [{ translateX }, { translateY }, { rotate }],
      }}
    >
      {shape === 'circle' ? (
        <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: col }} />
      ) : (
        <View style={{ width: size, height: size * 0.5, backgroundColor: col, borderRadius: 1 }} />
      )}
    </Animated.View>
  )
}

// ─── Animated text with bounce/wave ──────────────────────────────────────────
function WaveText({ text, style, baseDelay = 0, color: color }) {
  const chars = text.split('')
  const anims = useRef(chars.map(() => new Animated.Value(0))).current

  useEffect(() => {
    const wave = () => {
      Animated.stagger(
        60,
        chars.map((_, i) =>
          Animated.sequence([
            Animated.timing(anims[i], {
              toValue: -8,
              duration: 200,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(anims[i], {
              toValue: 0,
              duration: 300,
              easing: Easing.bounce,
              useNativeDriver: true,
            }),
          ])
        )
      ).start()
    }

    setTimeout(() => {
      wave()
      const interval = setInterval(wave, 3000)
      return () => clearInterval(interval)
    }, baseDelay)
  }, [])

  return (
    <View style={{ flexDirection: 'row' }}>
      {chars.map((ch, i) => (
        <Animated.Text
          key={i}
          style={[style, { color: color, transform: [{ translateY: anims[i] }] }]}
        >
          {ch === ' ' ? '\u00A0' : ch}
        </Animated.Text>
      ))}
    </View>
  )
}

// ─── Glitter shimmer overlay ──────────────────────────────────────────────────
function ShimmerBadge({ children }) {
  const shimmer = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start()
  }, [])

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-60, 60],
  })

  return (
    <View style={{ overflow: 'hidden', borderRadius: 22 }}>
      {children}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: 30,
          backgroundColor: 'rgba(255,255,255,0.35)',
          transform: [{ translateX }, { skewX: '-20deg' }],
        }}
      />
    </View>
  )
}

// ─── Pulsing ring ─────────────────────────────────────────────────────────────
function PulseRing({ size, col, delay }) {
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(300),
      ])
    ).start()
  }, [])

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.8] })
  const opacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.8, 0.3, 0] })

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: col,
        opacity,
        transform: [{ scale }],
      }}
    />
  )
}

// ─── Main Banner ──────────────────────────────────────────────────────────────
const SPARKLES = [
  { x: 5, y: 8, size: 8, color: '#FFD700', delay: 0 },
  { x: 20, y: 30, size: 6, color: '#FF6B6B', delay: 300 },
  { x: 45, y: 5, size: 10, color: '#00E5FF', delay: 600 },
  { x: 130, y: 10, size: 7, color: '#FF4081', delay: 150 },
  { x: 155, y: 35, size: 9, color: '#76FF03', delay: 450 },
  { x: 170, y: 12, size: 6, color: '#FFD740', delay: 750 },
  { x: 60, y: 85, size: 8, color: '#E040FB', delay: 200 },
  { x: 110, y: 70, size: 7, color: '#FF6D00', delay: 500 },
]

const FIREWORKS = [
  { x: 10, y: 15, delay: 400, colors: ['#FFD700', '#FF6B6B', '#fff'] },
  { x: 160, y: 10, delay: 900, colors: ['#00E5FF', '#76FF03', '#fff'] },
  { x: 80, y: 5, delay: 1400, colors: ['#FF4081', '#FFD740', '#fff'] },
  { x: 140, y: 50, delay: 700, colors: ['#E040FB', '#FF6D00', '#fff'] },
]

const BALLOONS = [
  { x: 8, col: '#FF4081', delay: 0, size: 18 },
  { x: 130, col: '#FFD740', delay: 600, size: 16 },
  { x: 155, col: '#00E5FF', delay: 1200, size: 20 },
  { x: 50, col: '#76FF03', delay: 400, size: 15 },
]

const CONFETTI = Array.from({ length: 18 }, (_, i) => ({
  x: (i / 18) * 185 - 10,
  col: ['#FF4081', '#FFD740', '#00E5FF', '#76FF03', '#E040FB', '#FF6D00'][i % 6],
  delay: (i * 120) % 2000,
  shape: i % 2 === 0 ? 'circle' : 'rect',
}))

export default function HomeBanner({ onShopNow }) {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current
  const scaleAnim = useRef(new Animated.Value(0.85)).current


  // Badge scale bounce
  const badgeBounce = useRef(new Animated.Value(1)).current

  // "LIVE" blink
  const blinkAnim = useRef(new Animated.Value(1)).current

  // Shop btn wiggle
  const btnWiggle = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Entrance
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start()

    // Badge bounce loop
    Animated.loop(
      Animated.sequence([
        Animated.spring(badgeBounce, {
          toValue: 1.2,
          tension: 200,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.spring(badgeBounce, {
          toValue: 1,
          tension: 200,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.delay(1800),
      ])
    ).start()

    // Blink LIVE
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.2,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.delay(600),
      ])
    ).start()

    // Btn wiggle
    Animated.loop(
      Animated.sequence([
        Animated.delay(2000),
        Animated.timing(btnWiggle, {
          toValue: 1,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(btnWiggle, {
          toValue: -1,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(btnWiggle, {
          toValue: 1,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(btnWiggle, {
          toValue: 0,
          duration: 60,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [])

  const btnTranslate = btnWiggle.interpolate({
    inputRange: [-1, 1],
    outputRange: [-3, 3],
  })

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      {/* ── Confetti rain ──────────────────────────────── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {CONFETTI.map((c, i) => (
          <Confetti key={i} {...c} />
        ))}
      </View>

      {/* ── Left: Copy ───────────────────────────────────── */}
      <View style={styles.leftCol}>
        {/* "Grand!" with wave animation */}
        <WaveText
          text="Shop In"
          style={styles.headingGrand}
          color={color.secondary}
          baseDelay={800}
        />

        {/* "Gudi Padwa" wave */}
        <WaveText
          text="Bulk & Get"
          style={styles.headingMain}
          color={color.secondary}
          baseDelay={1100}
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
          <View>
            {/* "Sale" wave */}
            <WaveText
              text="Off"
              style={styles.headingMain}
              color={color.secondary}
              baseDelay={1400}
            />

            <View style={styles.livePill}>
              <View style={styles.liveDotWrap}>
                <PulseRing size={10} col="#f3ff17" delay={0} />
                <PulseRing size={10} col="#f3ff17" delay={500} />
                <View style={styles.liveDot} />
              </View>
              <Animated.Text style={[styles.live, { opacity: blinkAnim }]}>
                LIVE
              </Animated.Text>
            </View>
          </View>

          <ShimmerBadge>
            <Animated.View style={[styles.badge, { transform: [{ scale: badgeBounce }] }]}>
              <Text style={styles.badgeUpTo}>GET</Text>
              <Text style={styles.badgePct}>MAX</Text>
              <Text style={styles.badgeOff}>SAVINGS</Text>
              <Text style={styles.starTL}>★</Text>
              <Text style={styles.starBR}>✦</Text>
            </Animated.View>
          </ShimmerBadge>
        </View>

        {/* Shop Now button with wiggle */}
        <Animated.View style={{ transform: [{ translateX: btnTranslate }], alignSelf: 'flex-start', marginTop: 8 }}>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={onShopNow}
            activeOpacity={0.8}
          >
            <Text style={styles.shopBtnText}>Shop Now</Text>
            <Icon name="arrow-right" size={ms(14)} color="#1565C0" />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* ── Right: Image + floating stars ─────────────── */}
      <View style={styles.rightCol}>
        {/* Extra sparkles around image */}
        <View style={styles.imageWrap} pointerEvents="none">
          <Sparkle x={0} y={10} size={10} color="#f3ff17" delay={100} />
          <Sparkle x={150} y={5} size={8} color="#f3ff17" delay={400} />
          <Sparkle x={5} y={100} size={7} color="#f3ff17" delay={700} />
          <Sparkle x={145} y={110} size={9} color="#f3ff17" delay={200} />
        </View>

        <Image
          source={{
            uri: "https://cdn3d.iconscout.com/3d/premium/thumb/economic-crisis-3d-icon-download-in-png-blend-fbx-gltf-file-formats--profit-economy-financial-investment-money-graph-business-and-finance-pack-icons-5307282.png"
          }}
          style={styles.bannerImage}
        />
      </View>
    </Animated.View>
  )
  
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = ScaledSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: '16@ms',
    minHeight: '120@vs',
  },

  leftCol: {
    flex: 1,
    paddingRight: '8@s',
    paddingVertical: '4@vs',
    zIndex: 10,
  },

  headingGrand: {
    fontSize: '22@ms',
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: '26@ms',
    color: color.secondary,
  },
  headingMain: {
    fontSize: '22@ms',
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: '26@ms',
    marginBottom: '2@vs',
  },

  // ── LIVE pill ──────────────────────────────────────────────────────────────
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '4@s',
    marginBottom: '8@vs',
  },
  liveDotWrap: {
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f3ff17',
    position: 'absolute',
  },
  live: {
    fontSize: '8@ms',
    fontWeight: '900',
    letterSpacing: 1.5,
    color: '#f3ff17',
  },

  // ── Badge ──────────────────────────────────────────────────────────────────
  badge: {
    backgroundColor: '#fff',
    width: '45@s',
    height: '45@s',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '24@ms',
    elevation: 6,
    shadowColor: '#FF4081',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  badgeUpTo: {
    fontSize: '5@ms',
    fontWeight: '900',
    color: color.primary,
    letterSpacing: 0.5,
    lineHeight: '6@ms',
  },
  badgePct: {
    fontSize: '13@ms',
    fontWeight: '900',
    color: color.primary,
    lineHeight: '15@ms',
  },
  badgeOff: {
    fontSize: '5@ms',
    fontWeight: '900',
    color: color.primary,
    letterSpacing: 0.5,
    lineHeight: '6@ms',
  },
  starTL: {
    position: 'absolute',
    top: '2@s',
    left: '3@s',
    fontSize: '5@ms',
    color: '#FFD700',
  },
  starBR: {
    position: 'absolute',
    bottom: '2@s',
    right: '3@s',
    fontSize: '4@ms',
    color: '#FF4081',
  },

  // ── Shop button ───────────────────────────────────────────────────────────
  shopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '6@s',
    backgroundColor: '#fff',
    paddingVertical: '7@vs',
    paddingLeft: '10@s',
    paddingRight: '12@s',
    borderRadius: '6@ms',
    elevation: 4,
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  shopBtnText: {
    color: '#1565C0',
    fontSize: '12@ms',
    fontWeight: '800',
  },

  // ── Right col ─────────────────────────────────────────────────────────────
  rightCol: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  imageWrap: {
    position: 'absolute',
    width: 180,
    height: 150,
    zIndex: 5,
  },
  bannerImage: {
    width: 150,
    height: 160,
    resizeMode: 'contain',
    zIndex: 2,
    marginRight:10
  },
})