import React, { Component } from 'react'
import PropTypes from 'prop-types'
import * as d3 from 'd3'
import cloneDeep from 'lodash.clonedeep'
import isEqual from 'lodash.isequal'
import throttle from 'lodash.throttle'

import Concept from './Concept.js'
import FocusedConcept from './FocusedConcept.js'
import { amtConceptTypeFor } from './fhir/medication.js'

import './AmtProductModel.css'

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
  }
  static defaultProps = {
    width: 1000,
    height: 1000,
    attraction: -1000,
    collideRadius: 100,
    linkDistance: 200,
    alpha: 1.5,
  }

  constructor(props) {
    super(props)
    this.state = {
      centerX: props.width / 2,
      centerY: props.height / 2,
    }
    this.handleMouseUp = this.handleMouseUp.bind(this)
    this.handleMouseMove = this.handleMouseMove.bind(this)
  }

  updateSimulation(
    nodes,
    links,
    attraction,
    collideRadius,
    linkDistance,
    alpha,
    centerX,
    centerY
  ) {
    const model = this
    model.simulation = (model.simulation || d3.forceSimulation()).nodes(nodes)
    model.forceLink = (model.forceLink || d3.forceLink())
      .id(d => d.code)
      .distance(linkDistance)
      .links(cloneDeep(links))
    model.forceManyBody = (model.forceManyBody || d3.forceManyBody())
      .strength(attraction)
    model.forceCollide = (model.forceCollide || d3.forceCollide())
      .radius(collideRadius)
    model.forceCenter = (model.forceCenter || d3.forceCenter())
      .x(centerX)
      .y(centerY)
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
      .alpha(1.5)
      .restart()
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
      const { lastDragX, lastDragY, centerX, centerY } = this.state
      const clientX = event.clientX
      const clientY = event.clientY
      if (lastDragX && lastDragY) {
        const deltaX = clientX - lastDragX
        const deltaY = clientY - lastDragY
        this.setState(() => ({
          lastDragX: clientX,
          lastDragY: clientY,
          centerX: centerX + deltaX,
          centerY: centerY + deltaY,
        }))
      } else {
        this.setState(() => ({
          lastDragX: clientX,
          lastDragY: clientY,
        }))
      }
    }
  }

  componentDidMount() {
    const {
      nodes,
      links,
      attraction,
      collideRadius,
      linkDistance,
      alpha,
    } = this.props
    const { centerX, centerY } = this.state
    if (nodes && links) {
      this.updateSimulation(
        nodes,
        links,
        attraction,
        collideRadius,
        linkDistance,
        alpha,
        centerX,
        centerY
      )
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { nodes, links } = nextProps
    if (!(nodes && links)) return false
    return true
  }

  componentWillUpdate(nextProps, nextState) {
    const {
      nodes,
      links,
      attraction,
      collideRadius,
      linkDistance,
      alpha,
    } = nextProps
    const { centerX, centerY } = nextState
    if (
      !isEqual(this.props, nextProps) ||
      this.state.centerX !== centerX ||
      this.state.centerY !== centerY
    ) {
      this.updateSimulation(
        nodes,
        links,
        attraction,
        collideRadius,
        linkDistance,
        alpha,
        centerX,
        centerY
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
      ? links.map((link, i) =>
        <line
          key={i}
          x1={link.source.x + 75}
          x2={link.target.x + 75}
          y1={link.source.y + 50}
          y2={link.target.y + 50}
        />
      )
      : []
    const handleMouseUp = throttle(this.handleMouseUp, 350)
    return (
      <div className='product-model'>
        <svg
          height='100%'
          width='100%'
          preserveAspectRatio='none'
          onMouseMove={this.handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {relationships}
        </svg>
        {concepts}
      </div>
    )
  }
}

export default AmtProductModel
