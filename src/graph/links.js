import React from 'react'

const rightAngle = Math.PI / 2
const southEast = Math.PI / 4
const southWest = 3 * Math.PI / 4
const northWest = 5 * Math.PI / 4
const northEast = 7 * Math.PI / 4
const fortyFiveDegrees = southEast

export const curveForLink = (link, i, options) => {
  const linkEndings = calculateLinkEndings(link, options)
  const { startX, startY, endX, endY } = linkEndings
  const { cp1x, cp1y, cp2x, cp2y } = calculateControlPoints(
    linkEndings,
    options
  )
  const curve = `M ${startX} ${startY} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${endX} ${endY}`
  return (
    <g key={i}>
      <path className='relationship' d={curve} />
      <circle r='5' cx={endX} cy={endY} fill='black' />
    </g>
  )
}

const calculateLinkEndings = (link, options) => {
  const { conceptWidth, conceptHeight } = options,
    x1 = link.source.x,
    x2 = link.target.x,
    y1 = link.source.y,
    y2 = link.target.y,
    adj = x2 - x1,
    opp = y2 - y1,
    adjU = Math.abs(adj),
    oppU = Math.abs(opp),
    angle = Math.atan(oppU / adjU),
    horizDistCenter = conceptWidth / 2,
    vertDistCenter = conceptHeight / 2
  const deltaX =
    angle < fortyFiveDegrees
      ? horizDistCenter
      : Math.tan(rightAngle - angle) * vertDistCenter
  const deltaY =
    angle < fortyFiveDegrees ? Math.tan(angle) * vertDistCenter : vertDistCenter
  return {
    startX: adj > 0 ? x1 + deltaX : x1 - deltaX,
    startY: opp > 0 ? y1 + deltaY : y1 - deltaY,
    endX: adj > 0 ? x2 - deltaX : x2 + deltaX,
    endY: opp > 0 ? y2 - deltaY : y2 + deltaY,
  }
}

const calculateControlPoints = (linkEndings, options) => {
  const { linkCurviness } = options,
    { startX, startY, endX, endY } = linkEndings,
    adj = endX - startX,
    opp = endY - startY,
    bearing =
      opp > 0 ? Math.atan2(opp, adj) : Math.atan2(opp, adj) + 2 * Math.PI,
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
  }
}
