import React from 'react'

export const curveForLink = (link, i, options) => {
  let mergedOptions = calculateBearings(link, options)
  mergedOptions = calculateLinkEndings(link, mergedOptions)
  mergedOptions = calculateControlPoints(mergedOptions)
  mergedOptions = calculateArrowPoints(mergedOptions)
  const {
    startX,
    startY,
    endX,
    endY,
    cp1x,
    cp1y,
    cp2x,
    cp2y,
    arrowPoints,
  } = mergedOptions
  const linkCurve = `M ${startX} ${startY} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${endX} ${endY}`
  const arrow =
    `M ${arrowPoints[0][0]} ${arrowPoints[0][1]} ` +
    arrowPoints.reduce((a, p) => a + `L ${p[0]} ${p[1]} `, '') +
    `L ${arrowPoints[0][0]} ${arrowPoints[0][1]}`
  return (
    <g key={i} className='relationship'>
      <path className='link' d={linkCurve} />
      <path className='arrow' d={arrow} />
    </g>
  )
}

const calculateBearings = (link, options) => {
  const { conceptWidth, conceptHeight } = options,
    conceptAngle = Math.atan(conceptHeight / conceptWidth),
    { source: { x: x1, y: y1 }, target: { x: x2, y: y2 } } = link,
    adj = x2 - x1,
    opp = y2 - y1,
    bearing =
      opp > 0 ? Math.atan2(opp, adj) : Math.atan2(opp, adj) + 2 * Math.PI
  return {
    ...options,
    conceptAngle,
    southEast: conceptAngle,
    southWest: Math.PI - conceptAngle,
    northWest: Math.PI + conceptAngle,
    northEast: 2 * Math.PI - conceptAngle,
    bearing,
  }
}

const calculateLinkEndings = (link, options) => {
  const {
      southEast,
      southWest,
      northWest,
      northEast,
      conceptWidth,
      conceptHeight,
      conceptAngle,
      bearing,
    } = options,
    { source: { x: x1, y: y1 }, target: { x: x2, y: y2 } } = link,
    horizDistCenter = conceptWidth / 2,
    vertDistCenter = conceptHeight / 2
  let angle
  switch (true) {
    case bearing >= northEast || bearing < southEast:
      angle = bearing < conceptAngle ? bearing : bearing - 2 * Math.PI
      return {
        ...options,
        startX: x1 + horizDistCenter,
        startY: y1 + horizDistCenter * Math.tan(angle),
        endX: x2 - horizDistCenter,
        endY: y2 - horizDistCenter * Math.tan(angle),
      }
    case bearing >= southEast && bearing < southWest:
      angle = bearing - Math.PI / 2
      return {
        ...options,
        startX: x1 - vertDistCenter * Math.tan(angle),
        startY: y1 + vertDistCenter,
        endX: x2 + vertDistCenter * Math.tan(angle),
        endY: y2 - vertDistCenter,
      }
    case bearing >= southWest && bearing < northWest:
      angle = bearing - Math.PI
      return {
        ...options,
        startX: x1 - horizDistCenter,
        startY: y1 - horizDistCenter * Math.tan(angle),
        endX: x2 + horizDistCenter,
        endY: y2 + horizDistCenter * Math.tan(angle),
      }
    case bearing >= northWest && bearing < northEast:
      angle = bearing - 3 * Math.PI / 2
      return {
        ...options,
        startX: x1 + vertDistCenter * Math.tan(angle),
        startY: y1 - vertDistCenter,
        endX: x2 - vertDistCenter * Math.tan(angle),
        endY: y2 + vertDistCenter,
      }
    default:
      throw new Error(`Unexpected bearing: ${bearing}`)
  }
}

const calculateControlPoints = options => {
  const {
      southEast,
      southWest,
      northWest,
      northEast,
      bearing,
      linkCurviness,
      startX,
      startY,
      endX,
      endY,
    } = options,
    adj = endX - startX,
    opp = endY - startY,
    angle = Math.atan(Math.abs(opp) / Math.abs(adj)),
    linkLength = Math.abs(opp) / Math.sin(angle),
    cpLength = linkLength * linkCurviness
  switch (true) {
    case bearing >= northEast || bearing < southEast:
      return {
        ...options,
        cp1x: startX + cpLength,
        cp1y: startY,
        cp2x: endX - cpLength,
        cp2y: endY,
      }
    case bearing >= southEast && bearing < southWest:
      return {
        ...options,
        cp1x: startX,
        cp1y: startY + cpLength,
        cp2x: endX,
        cp2y: endY - cpLength,
      }
    case bearing >= southWest && bearing < northWest:
      return {
        ...options,
        cp1x: startX - cpLength,
        cp1y: startY,
        cp2x: endX + cpLength,
        cp2y: endY,
      }
    case bearing >= northWest && bearing < northEast:
      return {
        ...options,
        cp1x: startX,
        cp1y: startY - cpLength,
        cp2x: endX,
        cp2y: endY + cpLength,
      }
    default:
      throw new Error(`Unexpected bearing: ${bearing}`)
  }
}

const calculateArrowPoints = options => {
  const {
      southEast,
      southWest,
      northWest,
      northEast,
      bearing,
      arrowSize,
      endX,
      endY,
    } = options,
    halfArrowSize = arrowSize / 2
  let point1, point2, point3
  switch (true) {
    case bearing >= northEast || bearing < southEast:
      point1 = [ endX, endY ]
      point2 = [ endX - arrowSize, endY + halfArrowSize ]
      point3 = [ endX - arrowSize, endY - halfArrowSize ]
      break
    case bearing >= southEast && bearing < southWest:
      point1 = [ endX, endY ]
      point2 = [ endX - halfArrowSize, endY - Math.sqrt(3) / 2 * arrowSize ]
      point3 = [ endX + halfArrowSize, endY - Math.sqrt(3) / 2 * arrowSize ]
      break
    case bearing >= southWest && bearing < northWest:
      point1 = [ endX, endY ]
      point2 = [ endX + arrowSize, endY + halfArrowSize ]
      point3 = [ endX + arrowSize, endY - halfArrowSize ]
      break
    case bearing >= northWest && bearing < northEast:
      point1 = [ endX, endY ]
      point2 = [ endX - halfArrowSize, endY + Math.sqrt(3) / 2 * arrowSize ]
      point3 = [ endX + halfArrowSize, endY + Math.sqrt(3) / 2 * arrowSize ]
      break
    default:
      throw new Error(`Unexpected bearing: ${bearing}`)
  }
  return { ...options, arrowPoints: [ point1, point2, point3 ] }
}
