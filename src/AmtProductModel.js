import React, { Component } from 'react'
import PropTypes from 'prop-types'
import * as d3 from 'd3'
import cloneDeep from 'lodash.clonedeep'

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
  }
  static defaultProps = {
    width: 1000,
    height: 1000,
    attraction: -1000,
    collideRadius: 100,
    linkDistance: 200,
    startX: 200,
    startY: 200,
  }

  constructor(props) {
    super(props)
    this.state = {}
  }

  updateSimulation(props) {
    const {
      nodes,
      links,
      width,
      height,
      attraction,
      collideRadius,
      linkDistance,
    } = props
    const amtProductModel = this
    amtProductModel.simulation = (amtProductModel.simulation ||
      d3.forceSimulation())
      .nodes(nodes)
    amtProductModel.forceLink = (amtProductModel.forceLink || d3.forceLink())
      .id(d => d.code)
      .distance(linkDistance)
      .links(cloneDeep(links))
    amtProductModel.simulation = amtProductModel.simulation
      .force('link', amtProductModel.forceLink)
      .force('charge', d3.forceManyBody().strength(attraction))
      .force('collide', d3.forceCollide(collideRadius))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .on('tick', function() {
        amtProductModel.setState(() => ({
          nodes: this.nodes(),
          links: amtProductModel.forceLink.links(),
        }))
      })
  }

  componentDidMount() {
    console.log('AmtProductModel componentDidMount', this.props)
    const { nodes, links } = this.props
    if (nodes && links) {
      this.updateSimulation(this.props)
    }
  }

  componentWillReceiveProps(nextProps) {
    console.log('AmtProductModel componentWillReceiveProps', { nextProps })
    const { nodes, links } = nextProps
    if (nodes && links) {
      this.updateSimulation(nextProps)
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
          x1={link.source.x + 50}
          x2={link.target.x + 50}
          y1={link.source.y + 50}
          y2={link.target.y + 50}
        />
      )
      : []
    return (
      <div className='product-model'>
        <svg height='100%' width='100%' preserveAspectRatio='none'>
          {relationships}
        </svg>
        {concepts}
      </div>
    )
  }
}

export default AmtProductModel
