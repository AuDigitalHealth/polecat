import React, { Component } from 'react'
import PropTypes from 'prop-types'
import * as d3 from 'd3'
import cloneDeep from 'lodash.clonedeep'
import isEqual from 'lodash.isequal'
import omit from 'lodash.omit'

import Concept from './Concept.js'
import FocusedConcept from './FocusedConcept.js'
import { amtConceptTypeFor, mergeConcepts } from './fhir/medication.js'
import { translateToAmt } from './fhir/translations.js'
import { curveForLink } from './graph/links.js'

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
    arrowSize: PropTypes.number,
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
    linkCurviness: 0.6,
    arrowSize: 10,
  }

  constructor(props) {
    super(props)
    this.state = {}
    this.handleMouseUp = this.handleMouseUp.bind(this)
    this.handleMouseMove = this.handleMouseMove.bind(this)
    this.handleWheel = this.handleWheel.bind(this)
    this.handleDoubleClick = this.handleDoubleClick.bind(this)
    this.renderConcepts = this.renderConcepts.bind(this)
    this.renderRelationships = this.renderRelationships.bind(this)
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
    let newNodes = null
    const { viewport } = this.props
    // If the simulation is already running, merge new nodes in instead of
    // replacing them.
    if (model.simulation) {
      let oldNodes = model.simulation.nodes()
      // Remove focus and fixing from any existing nodes.
      oldNodes = oldNodes.map(node => omit(node, 'focused', 'fx', 'fy'))
      // Merge new nodes with old nodes.
      newNodes = [ oldNodes, nodes ].reduce(mergeConcepts, [])
      // Remove any nodes that are not present in the new set of nodes.
      newNodes = newNodes.filter(node =>
        nodes.map(n => n.code).includes(node.code)
      )
      // Remove any nodes that are no longer the subject of a link.
      newNodes = newNodes.filter(node =>
        links
          .reduce((acc, link) => acc.concat([ link.source, link.target ]), [])
          .includes(node.code)
      )
      // Fix the position of the focused node.
      newNodes = newNodes.map(node => {
        if (node.focused) {
          node.fx = node.x = centerX || viewport.width / 2
          node.fy = node.y = centerY || viewport.height / 2
        }
        return node
      })
    } else newNodes = nodes
    model.simulation = (model.simulation || d3.forceSimulation())
      .nodes(newNodes)
    model.forceLink = (model.forceLink || d3.forceLink())
      .id(d => d.code)
      .distance(linkDistance)
      .links(cloneDeep(links))
    model.forceManyBody = (model.forceManyBody || d3.forceManyBody())
      .strength(attraction)
    model.forceCollide = (model.forceCollide || d3.forceCollide())
      .radius(collideRadius)
    model.forceCenter = (model.forceCenter || d3.forceCenter())
      .x(centerX || viewport.width / 2)
      .y(centerY || viewport.height / 2)
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
      fx: node.fx ? node.fx + deltaX : null,
      fy: node.fy ? node.fy + deltaY : null,
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
    const concepts = this.renderConcepts()
    const relationships = this.renderRelationships()
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

  renderConcepts() {
    const { conceptWidth, conceptHeight } = this.props,
      { nodes } = this.state
    return nodes
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
  }

  renderRelationships() {
    const {
        conceptWidth,
        conceptHeight,
        linkCurviness,
        arrowSize,
      } = this.props,
      { links } = this.state
    return links
      ? links.map((link, i) =>
        curveForLink(link, i, {
          conceptWidth,
          conceptHeight,
          linkCurviness,
          arrowSize,
        })
      )
      : []
  }
}

export default AmtProductModel
