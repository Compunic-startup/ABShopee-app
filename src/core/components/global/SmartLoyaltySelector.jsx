import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { ScaledSheet, ms, vs, s } from 'react-native-size-matters'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { 
  validatePointsRedemption, 
  getPointsSuggestions, 
  simulatePointsRedemption 
} from '../../services/loyaltyapi'
import color from '../../utils/color'
import FONTS from '../../utils/fonts'

const SmartLoyaltySelector = ({ 
  loyaltyInfo, 
  orderTotal, 
  orderDetails,
  onPointsSelected,
  onValidationError,
  selectedPoints: externalSelectedPoints,
  disabled = false
}) => {
  const [selectedPoints, setSelectedPoints] = useState(externalSelectedPoints || 0)
  const [customInput, setCustomInput] = useState('')
  const [validation, setValidation] = useState(null)
  const [suggestions, setSuggestions] = useState(null)
  const [simulation, setSimulation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('quick') // 'quick', 'custom', 'suggestions'

  const balance = loyaltyInfo?.loyaltyPointsBalance || 0
  const minPoints = loyaltyInfo?.loyaltyRule?.minPointsToRedeem || 100
  const maxCap = loyaltyInfo?.loyaltyRule?.maxRedeemCappedValue || 500
  const maxPercentage = loyaltyInfo?.loyaltyRule?.maxRedeemPercentage || 50
  const conversionRate = loyaltyInfo?.loyaltyRule?.conversionRate || 0.10

  // Calculate max usable points based on rules
  const maxByPercentage = Math.floor((orderTotal * maxPercentage) / 100 / conversionRate)
  const maxUsablePoints = Math.min(maxCap, maxByPercentage, balance)

  // Predefined quick options
  const quickOptions = [100, 200, 500].filter(amount => 
    amount >= minPoints && amount <= maxUsablePoints
  )

  useEffect(() => {
    if (externalSelectedPoints !== undefined) {
      setSelectedPoints(externalSelectedPoints)
    }
  }, [externalSelectedPoints])

  // Fetch suggestions on mount
  useEffect(() => {
    fetchSuggestions()
  }, [orderTotal])

  // Validate and simulate when points change
  useEffect(() => {
    if (selectedPoints > 0) {
      validateAndSimulate()
    } else {
      setValidation(null)
      setSimulation(null)
    }
  }, [selectedPoints])

  const fetchSuggestions = async () => {
    try {
      const response = await getPointsSuggestions(orderTotal, orderDetails?.items || [])
      if (response.success) {
        setSuggestions(response.data)
      }
    } catch (error) {
      console.log('Error fetching suggestions:', error)
    }
  }

  const validateAndSimulate = async () => {
    if (selectedPoints < minPoints) return
    
    setLoading(true)
    try {
      // Validate
      const validationRes = await validatePointsRedemption(selectedPoints, orderTotal)
      setValidation(validationRes.data)

      if (validationRes.data?.valid) {
        // Simulate
        const simulationRes = await simulatePointsRedemption(selectedPoints, orderTotal, orderDetails)
        setSimulation(simulationRes.data)
        
        // Notify parent
        onPointsSelected({
          points: selectedPoints,
          discount: validationRes.data?.discountValue || (selectedPoints * conversionRate),
          valid: true
        })
      } else {
        onValidationError?.(validationRes.data?.reason || 'Invalid points selection')
        onPointsSelected({ points: 0, discount: 0, valid: false })
      }
    } catch (error) {
      console.log('Validation/Simulation error:', error)
      onValidationError?.('Failed to validate points')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickSelect = (points) => {
    setSelectedPoints(points)
    setCustomInput(points.toString())
  }

  const handleCustomInput = (text) => {
    setCustomInput(text)
    const points = parseInt(text) || 0
    setSelectedPoints(points)
  }

  const handleMaxSelect = () => {
    const max = Math.floor(maxUsablePoints)
    setSelectedPoints(max)
    setCustomInput(max.toString())
  }

  const handleSuggestionSelect = (suggestion) => {
    setSelectedPoints(suggestion.points)
    setCustomInput(suggestion.points.toString())
    setActiveTab('quick')
  }

  const handleClear = () => {
    setSelectedPoints(0)
    setCustomInput('')
    setValidation(null)
    setSimulation(null)
    onPointsSelected({ points: 0, discount: 0, valid: false })
  }

  const discountValue = selectedPoints * conversionRate

  if (!loyaltyInfo || balance < minPoints) {
    return (
      <View style={styles.container}>
        <View style={styles.disabledCard}>
          <Icon name="star-off" size={ms(24)} color="#999" />
          <Text style={styles.disabledText}>
            {balance < minPoints 
              ? `Need ${minPoints - balance} more points to redeem`
              : 'No loyalty points available'
            }
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Balance Header */}
      <View style={styles.balanceRow}>
        <View style={styles.balanceInfo}>
          <Text style={styles.balanceLabel}>Available</Text>
          <Text style={styles.balanceValue}>{balance.toFixed(0)} points</Text>
        </View>
        <View style={styles.balanceInfo}>
          <Text style={styles.balanceLabel}>Max Usable</Text>
          <Text style={styles.balanceValue}>{Math.floor(maxUsablePoints)} points</Text>
        </View>
        <View style={styles.balanceInfo}>
          <Text style={styles.balanceLabel}>Value</Text>
          <Text style={styles.balanceValue}>₹{(balance * conversionRate).toFixed(0)}</Text>
        </View>
      </View>

      {/* Tab Selection */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'quick' && styles.tabActive]}
          onPress={() => setActiveTab('quick')}
        >
          <Text style={[styles.tabText, activeTab === 'quick' && styles.tabTextActive]}>
            Quick Select
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'custom' && styles.tabActive]}
          onPress={() => setActiveTab('custom')}
        >
          <Text style={[styles.tabText, activeTab === 'custom' && styles.tabTextActive]}>
            Custom
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'suggestions' && styles.tabActive]}
          onPress={() => setActiveTab('suggestions')}
        >
          <Text style={[styles.tabText, activeTab === 'suggestions' && styles.tabTextActive]}>
            Smart
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Select Tab */}
      {activeTab === 'quick' && (
        <View style={styles.quickSelectContainer}>
          <View style={styles.quickOptionsRow}>
            {quickOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.quickOption,
                  selectedPoints === option && styles.quickOptionSelected
                ]}
                onPress={() => handleQuickSelect(option)}
                disabled={disabled}
              >
                <Text style={[
                  styles.quickOptionText,
                  selectedPoints === option && styles.quickOptionTextSelected
                ]}>
                  {option}
                </Text>
                <Text style={styles.quickOptionSubtext}>
                  ₹{(option * conversionRate).toFixed(0)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity
            style={styles.maxButton}
            onPress={handleMaxSelect}
            disabled={disabled}
          >
            <Icon name="trophy" size={ms(16)} color={color.primary} />
            <Text style={styles.maxButtonText}>
              Use Maximum ({Math.floor(maxUsablePoints)} points)
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Custom Tab */}
      {activeTab === 'custom' && (
        <View style={styles.customContainer}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder={`Enter points (${minPoints}-${Math.floor(maxUsablePoints)})`}
              value={customInput}
              onChangeText={handleCustomInput}
              editable={!disabled}
            />
            <Text style={styles.inputSuffix}>pts</Text>
          </View>
          <Text style={styles.customHelper}>
            Min: {minPoints} | Max: {Math.floor(maxUsablePoints)} | 1pt = ₹{conversionRate}
          </Text>
        </View>
      )}

      {/* Smart Suggestions Tab */}
      {activeTab === 'suggestions' && suggestions && (
        <View style={styles.suggestionsContainer}>
          {suggestions.suggestions?.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.suggestionCard,
                suggestion.recommended && styles.suggestionRecommended,
                selectedPoints === suggestion.points && styles.suggestionSelected
              ]}
              onPress={() => handleSuggestionSelect(suggestion)}
              disabled={disabled}
            >
              <View style={styles.suggestionLeft}>
                {suggestion.recommended && (
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedText}>Recommended</Text>
                  </View>
                )}
                <Text style={styles.suggestionTitle}>{suggestion.description}</Text>
                {suggestion.remainingPoints && (
                  <Text style={styles.suggestionSubtext}>
                    Save {suggestion.remainingPoints} points for later
                  </Text>
                )}
              </View>
              <View style={styles.suggestionRight}>
                <Text style={styles.suggestionPoints}>{suggestion.points} pts</Text>
                <Text style={styles.suggestionDiscount}>₹{suggestion.discount?.toFixed(0)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Selected Points Summary */}
      {selectedPoints > 0 && (
        <View style={styles.summaryCard}>
          {loading ? (
            <ActivityIndicator size="small" color={color.primary} />
          ) : (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Points to Use</Text>
                <Text style={styles.summaryValue}>{selectedPoints}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={[styles.summaryValue, styles.discountValue]}>
                  -₹{discountValue.toFixed(2)}
                </Text>
              </View>
              {simulation && (
                <View style={styles.simulationInfo}>
                  <View style={styles.simulationRow}>
                    <Icon name="information" size={ms(14)} color="#666" />
                    <Text style={styles.simulationText}>
                      New total: ₹{simulation.simulation?.newOrderTotal?.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.simulationRow}>
                    <Icon name="star" size={ms(14)} color="#666" />
                    <Text style={styles.simulationText}>
                      Remaining: {simulation.simulation?.remainingPoints} points
                    </Text>
                  </View>
                </View>
              )}
              {validation && !validation.valid && (
                <View style={styles.errorContainer}>
                  <Icon name="alert-circle" size={ms(16)} color="#F44336" />
                  <Text style={styles.errorText}>{validation.reason}</Text>
                </View>
              )}
            </>
          )}
        </View>
      )}

      {/* Clear Button */}
      {selectedPoints > 0 && (
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Icon name="close-circle" size={ms(18)} color="#666" />
          <Text style={styles.clearText}>Clear Selection</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = ScaledSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: '12@ms',
    padding: '16@s',
    borderWidth: 1,
    borderColor: color.border,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: '16@vs',
    paddingBottom: '12@vs',
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  balanceInfo: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: '11@ms',
    color: '#666',
    fontFamily: FONTS.Regular,
    marginBottom: '2@vs',
  },
  balanceValue: {
    fontSize: '16@ms',
    color: color.text,
    fontFamily: FONTS.SemiBold,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: '16@vs',
    backgroundColor: color.background,
    borderRadius: '8@ms',
    padding: '4@s',
  },
  tab: {
    flex: 1,
    paddingVertical: '10@vs',
    alignItems: 'center',
    borderRadius: '6@ms',
  },
  tabActive: {
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: '13@ms',
    color: '#666',
    fontFamily: FONTS.Medium,
  },
  tabTextActive: {
    color: color.primary,
    fontFamily: FONTS.SemiBold,
  },
  quickSelectContainer: {
    gap: '12@vs',
  },
  quickOptionsRow: {
    flexDirection: 'row',
    gap: '10@s',
  },
  quickOption: {
    flex: 1,
    backgroundColor: color.background,
    borderRadius: '10@ms',
    paddingVertical: '14@vs',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  quickOptionSelected: {
    borderColor: color.primary,
    backgroundColor: color.primary + '10',
  },
  quickOptionText: {
    fontSize: '18@ms',
    color: color.text,
    fontFamily: FONTS.Bold,
  },
  quickOptionTextSelected: {
    color: color.primary,
  },
  quickOptionSubtext: {
    fontSize: '11@ms',
    color: '#666',
    fontFamily: FONTS.Regular,
    marginTop: '4@vs',
  },
  maxButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.primary + '10',
    borderRadius: '8@ms',
    paddingVertical: '12@vs',
    gap: '8@s',
  },
  maxButtonText: {
    fontSize: '14@ms',
    color: color.primary,
    fontFamily: FONTS.Medium,
  },
  customContainer: {
    gap: '8@vs',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.background,
    borderRadius: '10@ms',
    borderWidth: 2,
    borderColor: color.border,
    paddingHorizontal: '14@s',
  },
  input: {
    flex: 1,
    fontSize: '18@ms',
    color: color.text,
    fontFamily: FONTS.SemiBold,
    paddingVertical: '14@vs',
  },
  inputSuffix: {
    fontSize: '14@ms',
    color: '#666',
    fontFamily: FONTS.Medium,
  },
  customHelper: {
    fontSize: '12@ms',
    color: '#666',
    fontFamily: FONTS.Regular,
    textAlign: 'center',
  },
  suggestionsContainer: {
    gap: '10@vs',
  },
  suggestionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: color.background,
    borderRadius: '10@ms',
    padding: '14@s',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  suggestionRecommended: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
  },
  suggestionSelected: {
    borderColor: color.primary,
    backgroundColor: color.primary + '10',
  },
  suggestionLeft: {
    flex: 1,
  },
  recommendedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: '8@s',
    paddingVertical: '4@vs',
    borderRadius: '4@ms',
    alignSelf: 'flex-start',
    marginBottom: '6@vs',
  },
  recommendedText: {
    fontSize: '10@ms',
    color: '#fff',
    fontFamily: FONTS.Medium,
  },
  suggestionTitle: {
    fontSize: '14@ms',
    color: color.text,
    fontFamily: FONTS.Medium,
  },
  suggestionSubtext: {
    fontSize: '12@ms',
    color: '#666',
    fontFamily: FONTS.Regular,
    marginTop: '2@vs',
  },
  suggestionRight: {
    alignItems: 'flex-end',
  },
  suggestionPoints: {
    fontSize: '16@ms',
    color: color.text,
    fontFamily: FONTS.Bold,
  },
  suggestionDiscount: {
    fontSize: '12@ms',
    color: '#4CAF50',
    fontFamily: FONTS.Medium,
    marginTop: '2@vs',
  },
  summaryCard: {
    backgroundColor: color.primary + '05',
    borderRadius: '10@ms',
    padding: '14@s',
    marginTop: '16@vs',
    borderWidth: 1,
    borderColor: color.primary + '20',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8@vs',
  },
  summaryLabel: {
    fontSize: '14@ms',
    color: '#666',
    fontFamily: FONTS.Regular,
  },
  summaryValue: {
    fontSize: '16@ms',
    color: color.text,
    fontFamily: FONTS.SemiBold,
  },
  discountValue: {
    color: '#4CAF50',
  },
  simulationInfo: {
    marginTop: '10@vs',
    paddingTop: '10@vs',
    borderTopWidth: 1,
    borderTopColor: color.border,
    gap: '6@vs',
  },
  simulationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '6@s',
  },
  simulationText: {
    fontSize: '12@ms',
    color: '#666',
    fontFamily: FONTS.Regular,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '6@s',
    marginTop: '10@vs',
    padding: '10@s',
    backgroundColor: '#FFEBEE',
    borderRadius: '6@ms',
  },
  errorText: {
    fontSize: '12@ms',
    color: '#F44336',
    fontFamily: FONTS.Medium,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '12@vs',
    gap: '6@s',
  },
  clearText: {
    fontSize: '13@ms',
    color: '#666',
    fontFamily: FONTS.Medium,
  },
  disabledCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10@s',
    paddingVertical: '20@vs',
  },
  disabledText: {
    fontSize: '14@ms',
    color: '#999',
    fontFamily: FONTS.Medium,
  },
})

export default SmartLoyaltySelector
