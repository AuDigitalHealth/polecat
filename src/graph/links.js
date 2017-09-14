import React from 'react'

export const curveForLink = (link, i, options) => {
  const optionsWithBearings = {
    ...options,
    ...calculateBearings(link, options.conceptWidth, options.conceptHeight),
  }
  const linkEndings = calculateLinkEndings(link, optionsWithBearings)
  const { startX, startY, endX, endY } = linkEndings
  const { cp1x, cp1y, cp2x, cp2y } = calculateControlPoints(
    linkEndings,
    optionsWithBearings
  )
  const curve = `M ${startX} ${startY} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${endX} ${endY}`
  return (
    <g key={i}>
      <path className='relationship' d={curve} />
      <circle r='5' cx={endX} cy={endY} fill='black' />
    </g>
  )
}

const calculateBearings = (link, conceptWidth, conceptHeight) => {
  const conceptAngle = Math.atan(conceptHeight / conceptWidth),
    x1 = link.source.x,
    x2 = link.target.x,
    y1 = link.source.y,
    y2 = link.target.y,
    adj = x2 - x1,
    opp = y2 - y1,
    bearing =
      opp > 0 ? Math.atan2(opp, adj) : Math.atan2(opp, adj) + 2 * Math.PI
  return {
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
    x1 = link.source.x,
    x2 = link.target.x,
    y1 = link.source.y,
    y2 = link.target.y,
    horizDistCenter = conceptWidth / 2,
    vertDistCenter = conceptHeight / 2
  let angle
  switch (true) {
    case bearing >= northEast || bearing < southEast:
      angle = bearing < conceptAngle ? bearing : bearing - 2 * Math.PI
      return {
        startX: x1 + horizDistCenter,
        startY: y1 + horizDistCenter * Math.tan(angle),
        endX: x2 - horizDistCenter,
        endY: y2 - horizDistCenter * Math.tan(angle),
        bearing,
        angle,
      }
    case bearing >= southEast && bearing < southWest:
      angle = bearing - Math.PI / 2
      return {
        startX: x1 - vertDistCenter * Math.tan(angle),
        startY: y1 + vertDistCenter,
        endX: x2 + vertDistCenter * Math.tan(angle),
        endY: y2 - vertDistCenter,
        bearing,
        angle,
      }
    case bearing >= southWest && bearing < northWest:
      angle = bearing - Math.PI
      return {
        startX: x1 - horizDistCenter,
        startY: y1 - horizDistCenter * Math.tan(angle),
        endX: x2 + horizDistCenter,
        endY: y2 + horizDistCenter * Math.tan(angle),
        bearing,
        angle,
      }
    case bearing >= northWest && bearing < northEast:
      angle = bearing - 3 * Math.PI / 2
      return {
        startX: x1 + vertDistCenter * Math.tan(angle),
        startY: y1 - vertDistCenter,
        endX: x2 - vertDistCenter * Math.tan(angle),
        endY: y2 + vertDistCenter,
        bearing,
        angle,
      }
    default:
      throw new Error(`Unexpected bearing: ${bearing}`)
  }
}

const calculateControlPoints = (linkEndings, options) => {
  const {
      southEast,
      southWest,
      northWest,
      northEast,
      bearing,
      linkCurviness,
    } = options,
    { startX, startY, endX, endY } = linkEndings,
    adj = endX - startX,
    opp = endY - startY,
    angle = Math.atan(Math.abs(opp) / Math.abs(adj)),
    linkLength = Math.abs(opp) / Math.sin(angle),
    cpLength = linkLength * linkCurviness
  switch (true) {
    case bearing >= northEast || bearing < southEast:
      return {
        cp1x: startX + cpLength,
        cp1y: startY,
        cp2x: endX - cpLength,
        cp2y: endY,
      }
    case bearing >= southEast && bearing < southWest:
      return {
        cp1x: startX,
        cp1y: startY + cpLength,
        cp2x: endX,
        cp2y: endY - cpLength,
      }
    case bearing >= southWest && bearing < northWest:
      return {
        cp1x: startX - cpLength,
        cp1y: startY,
        cp2x: endX + cpLength,
        cp2y: endY,
      }
    case bearing >= northWest && bearing < northEast:
      return {
        cp1x: startX,
        cp1y: startY - cpLength,
        cp2x: endX,
        cp2y: endY + cpLength,
      }
    default:
      throw new Error(`Unexpected bearing: ${bearing}`)
  }
}
