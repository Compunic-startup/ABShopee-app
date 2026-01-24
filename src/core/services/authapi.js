import request from './api'

export const signupRequest = (identifier) => {
  return request({
    url: '/auth/signup',
    method: 'POST',
    body: { identifier },
  })
}

export const verifySignupRequest = ({
  identifier,
  otp,
  password,
  requestId,
}) => {
  return request({
    url: '/auth/signup/verify',
    method: 'POST',
    body: {
      identifier: identifier.trim().toLowerCase(),
      otp,
      context: 'registration',
      password,
      role: 'customer',
      requestId,
    },
  })
}

export const loginRequest = ({ identifier, password }) => {
  return request({
    url: '/auth/login',
    method: 'POST',
    body: { identifier, password },
  })
}
