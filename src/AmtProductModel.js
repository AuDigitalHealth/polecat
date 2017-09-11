import React, { Component } from 'react'
import PropTypes from 'prop-types'
import * as d3 from 'd3'
import cloneDeep from 'lodash.clonedeep'
import isEqual from 'lodash.isequal'

import Concept from './Concept.js'
import FocusedConcept from './FocusedConcept.js'
import { amtConceptTypeFor } from './fhir/medication.js'
import { translateToAmt } from './fhir/translations.js'

import './css/AmtProductModel.css'

class AmtProductModel extends Component {
  static propTypes = {
    nodes: PropTypes.arrayOf(
      PropTypes.shape({ code: PropTypes.string, display: PropTypes.string })
    ),
    links: PropTypes.arrayOf(
      PropTypes.shape({ source: PropTypes.string, target: PropTypes.string })
    ),
    attraction: PropTypes.number,
    collideRadius: PropTypes.number,
    linkDistance: PropTypes.number,
    alpha: PropTypes.number,
    alphaDecay: PropTypes.number,
    conceptWidth: PropTypes.number,
    conceptHeight: PropTypes.number,
    linkCurviness: PropTypes.number,
    maxCurveAngle: PropTypes.number,
    viewport: PropTypes.shape({
      width: PropTypes.number,
      height: PropTypes.number,
    }).isRequired,
  }
  static defaultProps = {
    attraction: -1000,
    collideRadius: 110,
    linkDistance: 200,
    alpha: 1.5,
    alphaDecay: 0.1,
    conceptWidth: 166,
    conceptHeight: 116,
    linkCurviness: 0.5,
    maxCurveAngle: 30,
  }

  constructor(props) {
    super(props)
    this.state = {}
    this.handleMouseUp = this.handleMouseUp.bind(this)
    this.handleMouseMove = this.handleMouseMove.bind(this)
    this.handleWheel = this.handleWheel.bind(this)
    this.handleDoubleClick = this.handleDoubleClick.bind(this)
  }

  startOrUpdateSimulation(
    nodes,
    links,
    attraction,
    collideRadius,
    linkDistance,
    alpha,
    alphaDecay,
    centerX,
    centerY
  ) {
    const model = this
    model.simulation = (model.simulation || d3.forceSimulation())
      .nodes(cloneDeep(nodes))
    model.forceLink = (model.forceLink || d3.forceLink())
      .id(d => d.code)
      .distance(linkDistance)
      .links(cloneDeep(links))
    model.forceManyBody = (model.forceManyBody || d3.forceManyBody())
      .strength(attraction)
    model.forceCollide = (model.forceCollide || d3.forceCollide())
      .radius(collideRadius)
    model.forceCenter = (model.forceCenter || d3.forceCenter())
      .x(centerX || this.props.viewport.width / 2)
      .y(centerY || this.props.viewport.height / 2)
    model.simulation = model.simulation
      .force('link', model.forceLink)
      .force('charge', model.forceManyBody)
      .force('collide', model.forceCollide)
      .force('center', model.forceCenter)
      .on('tick', function() {
        model.setState(() => ({
          nodes: model.simulation.nodes(),
          links: model.forceLink.links(),
        }))
      })
      .alpha(alpha)
      .alphaDecay(alphaDecay)
      .restart()
  }

  moveSimulationCenter(deltaX, deltaY, newX, newY) {
    const model = this
    const forceCenter = model.simulation.force('center')
    const nodes = model.simulation.nodes().map(node => ({
      ...node,
      x: node.x + deltaX,
      y: node.y + deltaY,
    }))
    const {
      links,
      attraction,
      collideRadius,
      linkDistance,
      alphaDecay,
    } = this.props
    const { relationships: translatedLinks } = translateToAmt({
      concepts: nodes,
      relationships: links,
    })
    const centerX = deltaX !== null ? forceCenter.x() + deltaX : newX
    const centerY = deltaY !== null ? forceCenter.y() + deltaY : newY
    this.startOrUpdateSimulation(
      nodes,
      translatedLinks,
      attraction,
      collideRadius,
      linkDistance,
      model.simulation.alpha(),
      alphaDecay,
      centerX,
      centerY
    )
  }

  curveForLink(link, i) {
    const { conceptWidth, conceptHeight } = this.props
    const curviness = 0.5
    const maxCurveAngle = 30
    const rightAngle = Math.PI / 2
    const eighth = Math.PI / 4
    const radiansInDegree = Math.PI / 180
    const x1 = link.source.x
    const x2 = link.target.x
    const y1 = link.source.y
    const y2 = link.target.y
    const adj = x2 - x1
    const opp = y2 - y1
    const adjU = adj < 0 ? -adj : adj
    const oppU = opp < 0 ? -opp : opp
    const angle = Math.atan(oppU / adjU)
    const horizDistCenter = conceptWidth / 2
    const vertDistCenter = conceptHeight / 2
    const deltaX =
      angle < eighth
        ? horizDistCenter
        : Math.tan(rightAngle - angle) * vertDistCenter
    const deltaY =
      angle < eighth ? Math.tan(angle) * vertDistCenter : vertDistCenter
    const startX = adj > 0 ? x1 + deltaX : x1 - deltaX
    const startY = opp > 0 ? y1 + deltaY : y1 - deltaY
    const endX = adj > 0 ? x2 - deltaX : x2 + deltaX
    const endY = opp > 0 ? y2 - deltaY : y2 + deltaY
    const linkAdjU = Math.abs(endX - startX)
    const linkOppU = Math.abs(endY - startY)
    const linkAngle = Math.atan(linkOppU / linkAdjU)
    const linkLength = linkOppU / Math.sin(linkAngle)
    const cpLength = linkLength * curviness
    const maxCurveRadians = maxCurveAngle * radiansInDegree
    const shareOfRightAngle = angle / rightAngle
    const curveAngleIncrement =
      angle > eighth
        ? maxCurveRadians * (1 - shareOfRightAngle)
        : maxCurveRadians * shareOfRightAngle
    const curveAngle = angle + curveAngleIncrement
    const cp1x =
      adj > 0
        ? startX + Math.cos(curveAngle) * cpLength
        : startX - Math.cos(curveAngle) * cpLength
    const cp1y =
      opp > 0
        ? startY + Math.sin(curveAngle) * cpLength
        : startY - Math.sin(curveAngle) * cpLength
    const cp2x =
      adj > 0
        ? endX - Math.cos(curveAngle) * cpLength
        : endX + Math.cos(curveAngle) * cpLength
    const cp2y =
      opp > 0
        ? endY - Math.sin(curveAngle) * cpLength
        : endY + Math.sin(curveAngle) * cpLength
    const curve = `M ${startX} ${startY} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${endX} ${endY}`
    return (
      <g>
        <path className='relationship' key={i} d={curve} />
        <circle r='5' cx={endX} cy={endY} fill='black' />
      </g>
    )
  }

  handleMouseUp(event) {
    if (event.buttons === 0) {
      const { lastDragX, lastDragY } = this.state
      if (lastDragX && lastDragY) {
        this.setState(() => ({ lastDragX: null, lastDragY: null }))
      }
    }
  }

  handleMouseMove(event) {
    if (event.buttons === 1) {
      const { lastDragX, lastDragY } = this.state
      const clientX = event.clientX
      const clientY = event.clientY
      if (lastDragX && lastDragY) {
        this.moveSimulationCenter(clientX - lastDragX, clientY - lastDragY)
        this.setState(() => ({
          lastDragX: clientX,
          lastDragY: clientY,
        }))
      } else {
        this.setState(() => ({
          lastDragX: clientX,
          lastDragY: clientY,
        }))
      }
    }
  }

  handleWheel(event) {
    this.moveSimulationCenter(event.deltaX * -1, event.deltaY * -1)
    event.preventDefault()
  }

  handleDoubleClick(event) {
    this.moveSimulationCenter(
      null,
      null,
      this.props.viewport.width / 2,
      this.props.viewport.height / 2
    )
  }

  componentDidMount() {
    const {
      nodes,
      links,
      attraction,
      collideRadius,
      linkDistance,
      alpha,
      alphaDecay,
    } = this.props
    if (nodes && links) {
      const { relationships: translatedLinks } = translateToAmt({
        concepts: nodes,
        relationships: links,
      })
      this.startOrUpdateSimulation(
        nodes,
        translatedLinks,
        attraction,
        collideRadius,
        linkDistance,
        alpha,
        alphaDecay
      )
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { nodes, links } = nextProps
    if (!(nodes && links)) return false
    return true
  }

  componentWillReceiveProps(nextProps) {
    const {
      attraction,
      collideRadius,
      linkDistance,
      alpha,
      alphaDecay,
      viewport: { width, height },
    } = nextProps
    const { concepts: nodes, relationships: links } = translateToAmt({
      concepts: nextProps.nodes,
      relationships: nextProps.links,
    })
    if (!isEqual(this.props.nodes, nextProps.nodes)) {
      this.startOrUpdateSimulation(
        nodes,
        links,
        attraction,
        collideRadius,
        linkDistance,
        alpha,
        alphaDecay
      )
    }
    if (!isEqual(this.props.viewport, nextProps.viewport)) {
      this.moveSimulationCenter(null, null, width / 2, height / 2)
    }
  }

  render() {
    const {
      conceptWidth,
      conceptHeight,
      linkCurviness,
      maxCurveAngle,
    } = this.props
    const { nodes, links } = this.state
    const concepts = nodes
      ? nodes.map(
        (node, i) =>
          node.focused
            ? <FocusedConcept
              key={i}
              sctid={node.code}
              display={node.display}
              type={amtConceptTypeFor(node.type)}
              top={node.y - conceptHeight / 2}
              left={node.x - conceptWidth / 2}
              width={conceptWidth}
              height={conceptHeight}
            />
            : <Concept
              key={i}
              sctid={node.code}
              display={node.display}
              type={amtConceptTypeFor(node.type)}
              top={node.y - conceptHeight / 2}
              left={node.x - conceptWidth / 2}
              width={conceptWidth}
              height={conceptHeight}
            />
      )
      : []
    const relationships = links
      ? links.map((link, i) =>
        this.curveForLink(link, i, {
          conceptWidth,
          conceptHeight,
          linkCurviness,
          maxCurveAngle,
        })
      )
      : []
    return (
      <div className='product-model' onWheel={this.handleWheel}>
        <svg
          height='100%'
          width='100%'
          preserveAspectRatio='none'
          onMouseMove={this.handleMouseMove}
          onMouseUp={this.handleMouseUp}
          onDoubleClick={this.handleDoubleClick}
        >
          {relationships}
        </svg>
        {concepts}
      </div>
    )
  }
}

export default AmtProductModel
