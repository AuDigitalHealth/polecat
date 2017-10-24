import React from 'react'

import { codingToGroupCode } from '../fhir/medication.js'

// Returns a SVG representation of a curved arrow with an arrow head based upon
// the type of relationship.
export const curveForLink = (link, i, options) => {
  let mergedOptions = calculateBearings(link, options)
  mergedOptions = calculateLinkEndings(link, mergedOptions)
  mergedOptions = calculateControlPoints(mergedOptions)
  const { startX, startY, endX, endY, cp1x, cp1y, cp2x, cp2y } = mergedOptions
  const linkPath = `M ${startX} ${startY} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${endX} ${endY}`
  let arrow = null
  if (link.type !== 'unknown') {
    const { arrowPoints } =
      link.type === 'is-component-of'
        ? calculateAggregationPoints(mergedOptions)
        : calculateArrowPoints({
          ...mergedOptions,
          linkType: link.type,
        })
    const arrowPath =
      `M ${arrowPoints[0][0]} ${arrowPoints[0][1]} ` +
      arrowPoints.reduce((a, p) => a + `L ${p[0]} ${p[1]} `, '').trim()
    arrow = <path className='arrow' d={arrowPath} />
  }
  return (
    <g key={i} className={`relationship relationship-${link.type}`}>
      <path className='link' d={linkPath} />
      {arrow}
    </g>
  )
}

// Calculates the bearing between the two concepts, and the diagonals of each
// concept based on their sizes. The diagonals are used to determine which side
// of the concept to put the link ending on.
const calculateBearings = (link, options) => {
  const {
      conceptWidth,
      conceptHeight,
      conceptGroupWidth,
      conceptGroupHeight,
    } = options,
    conceptAngle = Math.atan(conceptHeight / conceptWidth),
    conceptGroupAngle = Math.atan(conceptGroupHeight / conceptGroupWidth),
    { source: { x: x1, y: y1 }, target: { x: x2, y: y2 } } = link,
    adj = x2 - x1,
    opp = y2 - y1,
    bearing =
      opp > 0 ? Math.atan2(opp, adj) : Math.atan2(opp, adj) + 2 * Math.PI
  return {
    ...options,
    conceptAngle,
    conceptGroupAngle,
    southEast: conceptAngle,
    southWest: Math.PI - conceptAngle,
    northWest: Math.PI + conceptAngle,
    northEast: 2 * Math.PI - conceptAngle,
    groupSouthEast: conceptGroupAngle,
    groupSouthWest: Math.PI - conceptGroupAngle,
    groupNorthWest: Math.PI + conceptGroupAngle,
    groupNorthEast: 2 * Math.PI - conceptGroupAngle,
    bearing,
  }
}

// Calculates the co-ordinates of the start and end points of the link.
const calculateLinkEndings = (link, options) => {
  const {
      southEast,
      southWest,
      northWest,
      northEast,
      conceptWidth,
      conceptHeight,
      conceptGroupWidth,
      conceptGroupHeight,
      conceptAngle,
      bearing,
    } = options,
    { source: { x: x1, y: y1 }, target: { x: x2, y: y2 } } = link,
    sourceIsGroup = !!codingToGroupCode(link.source.coding),
    targetIsGroup = !!codingToGroupCode(link.target.coding),
    sourceHorizDistCenter = sourceIsGroup
      ? conceptGroupWidth / 2
      : conceptWidth / 2,
    targetHorizDistCenter = targetIsGroup
      ? conceptGroupWidth / 2
      : conceptWidth / 2,
    sourceVertDistCenter = sourceIsGroup
      ? conceptGroupHeight / 2
      : conceptHeight / 2,
    targetVertDistCenter = targetIsGroup
      ? conceptGroupHeight / 2
      : conceptHeight / 2
  let angle
  switch (true) {
    case bearing >= northEast || bearing < southEast:
      angle = bearing < conceptAngle ? bearing : bearing - 2 * Math.PI
      return {
        ...options,
        startX: x1 + sourceHorizDistCenter,
        startY: y1 + sourceHorizDistCenter * Math.tan(angle),
        endX: x2 - targetHorizDistCenter,
        endY: y2 - targetHorizDistCenter * Math.tan(angle),
      }
    case bearing >= southEast && bearing < southWest:
      angle = bearing - Math.PI / 2
      return {
        ...options,
        startX: x1 - sourceVertDistCenter * Math.tan(angle),
        startY: y1 + sourceVertDistCenter,
        endX: x2 + targetVertDistCenter * Math.tan(angle),
        endY: y2 - targetVertDistCenter,
      }
    case bearing >= southWest && bearing < northWest:
      angle = bearing - Math.PI
      return {
        ...options,
        startX: x1 - sourceHorizDistCenter,
        startY: y1 - sourceHorizDistCenter * Math.tan(angle),
        endX: x2 + targetHorizDistCenter,
        endY: y2 + targetHorizDistCenter * Math.tan(angle),
      }
    case bearing >= northWest && bearing < northEast:
      angle = bearing - 3 * Math.PI / 2
      return {
        ...options,
        startX: x1 + sourceVertDistCenter * Math.tan(angle),
        startY: y1 - sourceVertDistCenter,
        endX: x2 - targetVertDistCenter * Math.tan(angle),
        endY: y2 + targetVertDistCenter,
      }
    default:
      throw new Error(`Unexpected bearing: ${bearing}`)
  }
}

// Calculates the control points for the Bézier curve, based on the curviness
// and the distance between the concepts.
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
      arrowSize,
    } = options,
    adj = endX - startX,
    opp = endY - startY,
    angle = Math.atan(Math.abs(opp) / Math.abs(adj)),
    linkLength = Math.abs(opp) / Math.sin(angle),
    cpLength = arrowSize + linkLength * linkCurviness
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

// This function renders inheritance and association type relationships.
// Inheritance is shown as a filled triangle, while association is an open arrow
// head.
const calculateArrowPoints = options => {
  const {
      southEast,
      southWest,
      northWest,
      northEast,
      bearing,
      endX,
      endY,
      arrowSize,
      linkType,
    } = options,
    halfArrowSize = arrowSize / 2
  const points = []
  switch (true) {
    case bearing >= northEast || bearing < southEast:
      points.push([ endX - arrowSize, endY + halfArrowSize ])
      points.push([ endX, endY ])
      points.push([ endX - arrowSize, endY - halfArrowSize ])
      if (linkType === 'is-a') {
        points.push([ endX - arrowSize, endY + halfArrowSize ])
      }
      break
    case bearing >= southEast && bearing < southWest:
      points.push([ endX - halfArrowSize, endY - Math.sqrt(3) / 2 * arrowSize ])
      points.push([ endX, endY ])
      points.push([ endX + halfArrowSize, endY - Math.sqrt(3) / 2 * arrowSize ])
      if (linkType === 'is-a') {
        points.push([ endX - halfArrowSize, endY - Math.sqrt(3) / 2 * arrowSize ])
      }
      break
    case bearing >= southWest && bearing < northWest:
      points.push([ endX + arrowSize, endY + halfArrowSize ])
      points.push([ endX, endY ])
      points.push([ endX + arrowSize, endY - halfArrowSize ])
      if (linkType === 'is-a') {
        points.push([ endX + arrowSize, endY + halfArrowSize ])
      }
      break
    case bearing >= northWest && bearing < northEast:
      points.push([ endX - halfArrowSize, endY + Math.sqrt(3) / 2 * arrowSize ])
      points.push([ endX, endY ])
      points.push([ endX + halfArrowSize, endY + Math.sqrt(3) / 2 * arrowSize ])
      if (linkType === 'is-a') {
        points.push([ endX - halfArrowSize, endY + Math.sqrt(3) / 2 * arrowSize ])
      }
      break
    default:
      throw new Error(`Unexpected bearing: ${bearing}`)
  }
  return { ...options, arrowPoints: points }
}

// This function renders aggregation relationships. It is reversed, i.e. the
// aggregation symbol is displayed at the start of the link, on the source side.
const calculateAggregationPoints = options => {
  const {
      southEast,
      southWest,
      northWest,
      northEast,
      bearing,
      startX,
      startY,
    } = options,
    arrowSize = options.arrowSize * 0.7,
    halfArrowSize = arrowSize / 2
  const points = []
  switch (true) {
    case bearing >= northEast || bearing < southEast:
      points.push([ startX + arrowSize, startY + halfArrowSize ])
      points.push([ startX, startY ])
      points.push([ startX + arrowSize, startY - halfArrowSize ])
      points.push([ startX + 2 * Math.sqrt(3) / 2 * arrowSize, startY ])
      points.push([ startX + arrowSize, startY + halfArrowSize ])
      break
    case bearing >= southEast && bearing < southWest:
      points.push([
        startX - halfArrowSize,
        startY + Math.sqrt(3) / 2 * arrowSize,
      ])
      points.push([ startX, startY ])
      points.push([
        startX + halfArrowSize,
        startY + Math.sqrt(3) / 2 * arrowSize,
      ])
      points.push([ startX, startY + 2 * Math.sqrt(3) / 2 * arrowSize ])
      points.push([
        startX - halfArrowSize,
        startY + Math.sqrt(3) / 2 * arrowSize,
      ])
      break
    case bearing >= southWest && bearing < northWest:
      points.push([ startX - arrowSize, startY + halfArrowSize ])
      points.push([ startX, startY ])
      points.push([ startX - arrowSize, startY - halfArrowSize ])
      points.push([ startX - 2 * Math.sqrt(3) / 2 * arrowSize, startY ])
      points.push([ startX - arrowSize, startY + halfArrowSize ])
      break
    case bearing >= northWest && bearing < northEast:
      points.push([
        startX - halfArrowSize,
        startY - Math.sqrt(3) / 2 * arrowSize,
      ])
      points.push([ startX, startY ])
      points.push([
        startX + halfArrowSize,
        startY - Math.sqrt(3) / 2 * arrowSize,
      ])
      points.push([ startX, startY - 2 * Math.sqrt(3) / 2 * arrowSize ])
      points.push([
        startX - halfArrowSize,
        startY - Math.sqrt(3) / 2 * arrowSize,
      ])
      break
    default:
      throw new Error(`Unexpected bearing: ${bearing}`)
  }
  return { ...options, arrowPoints: points }
}
