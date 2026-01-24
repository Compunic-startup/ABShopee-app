export const BASE_URL = 'http://192.168.31.38:9100'

const request = async ({
  url,
  method = 'GET',
  body,
  headers = {},
}) => {
  const res = await fetch(BASE_URL + url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json()

  if (!res.ok) {
    throw data
  }

  return data
}

// export default BASE_URL
export default request
