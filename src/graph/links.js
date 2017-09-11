import React from 'react'

const rightAngle = Math.PI / 2
const eighth = Math.PI / 4
const radiansInDegree = Math.PI / 180

export const curveForLink = (link, i, options) => {
  const linkEndings = calculateLinkEndings(link, options)
  const { startX, startY, endX, endY } = linkEndings
  const { cp1x, cp1y, cp2x, cp2y } = calculateControlPoints(
    linkEndings,
    options
  )
  const curve = `M ${startX} ${startY} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${endX} ${endY}`
  return (
    <g>
      <path className='relationship' key={i} d={curve} />
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
    angle < eighth
      ? horizDistCenter
      : Math.tan(rightAngle - angle) * vertDistCenter
  const deltaY =
    angle < eighth ? Math.tan(angle) * vertDistCenter : vertDistCenter
  return {
    startX: adj > 0 ? x1 + deltaX : x1 - deltaX,
    startY: opp > 0 ? y1 + deltaY : y1 - deltaY,
    endX: adj > 0 ? x2 - deltaX : x2 + deltaX,
    endY: opp > 0 ? y2 - deltaY : y2 + deltaY,
  }
}

const calculateControlPoints = (linkEndings, options) => {
  const { linkCurviness, maxCurveAngle } = options,
    { startX, startY, endX, endY } = linkEndings,
    adj = endX - startX,
    opp = endY - startY,
    adjU = Math.abs(adj),
    oppU = Math.abs(opp),
    angle = Math.atan(oppU / adjU),
    linkLength = oppU / Math.sin(angle),
    cpLength = linkLength * linkCurviness,
    maxCurveRadians = maxCurveAngle * radiansInDegree,
    shareOfRightAngle = angle / rightAngle,
    curveAngleIncrement =
      angle > eighth
        ? maxCurveRadians * (1 - shareOfRightAngle)
        : maxCurveRadians * shareOfRightAngle,
    curveAngle = angle + curveAngleIncrement
  return {
    cp1x:
      adj > 0
        ? startX + Math.cos(curveAngle) * cpLength
        : startX - Math.cos(curveAngle) * cpLength,
    cp1y:
      opp > 0
        ? startY + Math.sin(curveAngle) * cpLength
        : startY - Math.sin(curveAngle) * cpLength,
    cp2x:
      adj > 0
        ? endX - Math.cos(curveAngle) * cpLength
        : endX + Math.cos(curveAngle) * cpLength,
    cp2y:
      opp > 0
        ? endY - Math.sin(curveAngle) * cpLength
        : endY + Math.sin(curveAngle) * cpLength,
  }
}
