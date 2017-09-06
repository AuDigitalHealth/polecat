import React, { Component } from 'react'
import PropTypes from 'prop-types'
import * as d3 from 'd3'
import cloneDeep from 'lodash.clonedeep'
import isEqual from 'lodash.isequal'

import Concept from './Concept.js'
import FocusedConcept from './FocusedConcept.js'
import { amtConceptTypeFor } from './fhir/medication.js'

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
  }
  static defaultProps = {
    width: 1000,
    height: 1000,
    attraction: -1000,
    collideRadius: 110,
    linkDistance: 200,
    alpha: 1.5,
    alphaDecay: 0.1,
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
      .x(centerX || this.props.width / 2)
      .y(centerY || this.props.height / 2)
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
    const centerX = deltaX !== null ? forceCenter.x() + deltaX : newX
    const centerY = deltaY !== null ? forceCenter.y() + deltaY : newY
    this.startOrUpdateSimulation(
      nodes,
      links,
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
      this.props.width / 2,
      this.props.height / 2
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
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { nodes, links } = nextProps
    if (!(nodes && links)) return false
    return true
  }

  componentWillReceiveProps(nextProps) {
    const {
      nodes,
      links,
      attraction,
      collideRadius,
      linkDistance,
      alpha,
      alphaDecay,
    } = nextProps
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
  }

  render() {
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
              top={node.y}
              left={node.x}
              width={150}
              height={100}
            />
            : <Concept
              key={i}
              sctid={node.code}
              display={node.display}
              type={amtConceptTypeFor(node.type)}
              top={node.y}
              left={node.x}
              width={150}
              height={100}
            />
      )
      : []
    const relationships = links
      ? links.map((link, i) => {
        const x1 = link.source.x + 75
        const x2 = link.target.x + 75
        const y1 = link.source.y + 50
        const y2 = link.target.y + 50
        const commands = `M ${x1} ${y1} L${x2} ${y2}`
        return <path className='relationship' key={i} d={commands} />
      })
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
