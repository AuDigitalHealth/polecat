// SHA-256 function from https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
export async function sha256(str) {
  // We transform the string into an arraybuffer.
  const buffer = new TextEncoder('utf-8').encode(str)
  return crypto.subtle.digest('SHA-256', buffer).then(function(hash) {
    return hex(hash)
  })
}

function hex(buffer) {
  const hexCodes = []
  const view = new DataView(buffer)
  for (let i = 0; i < view.byteLength; i += 4) {
    // Using getUint32 reduces the number of iterations needed (we process 4 bytes each time)
    const value = view.getUint32(i)
    // toString(16) will give the hex representation of the number without padding
    const stringValue = value.toString(16)
    // We use concatenation and slice for padding
    const padding = '00000000'
    const paddedValue = (padding + stringValue).slice(-padding.length)
    hexCodes.push(paddedValue)
  }

  // Join all the hex strings into one
  return hexCodes.join('')
}

export const formatNumber = number => {
  if (typeof number !== 'number') return undefined
  const numString = number.toString()
  return [...numString].reduce((prev, curr, i, arr) => {
    return arr.length - i - 1 !== 0 && (arr.length - i - 1) % 3 === 0
      ? prev + curr + ','
      : prev + curr
  }, '')
}
