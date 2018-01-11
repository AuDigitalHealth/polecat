import React, { Component } from 'react'
import PropTypes from 'prop-types'
import * as d3 from 'd3'
import cloneDeep from 'lodash.clonedeep'
import isEqual from 'lodash.isequal'
import omit from 'lodash.omit'
import pick from 'lodash.pick'
import debounce from 'lodash.debounce'

import Concept from './Concept.js'
import ConceptGroup from './ConceptGroup.js'
import { searchPathFromQuery } from './Router.js'
import {
  amtConceptTypeFor,
  mergeConcepts,
  codingToSnomedCode,
  codingToGroupCode,
  humaniseRelationshipType,
} from './fhir/medication.js'
import { translateToAmt } from './graph/translations.js'
import {
  curveForLink,
  associationMarker,
  inheritanceMarker,
  aggregationMarker,
} from './graph/links.js'

import './css/AmtProductModel.css'

class AmtProductModel extends Component {
  static propTypes = {
    nodes: PropTypes.arrayOf(
      PropTypes.shape({
        coding: PropTypes.arrayOf(
          PropTypes.shape({
            system: PropTypes.string,
            code: PropTypes.string,
            display: PropTypes.string,
          }),
        ),
        type: PropTypes.string.isRequired,
      }),
    ),
    links: PropTypes.arrayOf(
      PropTypes.shape({ source: PropTypes.string, target: PropTypes.string }),
    ),
    attraction: PropTypes.number,
    linkDistance: PropTypes.number,
    alpha: PropTypes.number,
    alphaDecay: PropTypes.number,
    alphaMin: PropTypes.number,
    conceptWidth: PropTypes.number,
    conceptHeight: PropTypes.number,
    conceptGroupWidth: PropTypes.number,
    conceptGroupHeight: PropTypes.number,
    linkCurviness: PropTypes.number,
    arrowSize: PropTypes.number,
    // Specifies the ratio between concept radius and collide radius.
    collideRadiusRatio: PropTypes.number,
    // Specifies a threshold over which an additional multiplier is applied to
    // collide threshold.
    collideRadiusThreshold: PropTypes.number,
    // Increases collide radius by an additional multiplier for each concept
    // over the `collideRadiusThreshold`.
    collideRadiusMultiplier: PropTypes.number,
    viewport: PropTypes.shape({
      width: PropTypes.number,
      height: PropTypes.number,
    }).isRequired,
  }
  static defaultProps = {
    attraction: -1000,
    linkDistance: 220,
    alpha: 1.5,
    alphaDecay: 0.015,
    alphaMin: 0.05,
    conceptWidth: 166,
    conceptHeight: 116,
    conceptGroupWidth: 100,
    conceptGroupHeight: 47,
    linkCurviness: 0.2,
    arrowSize: 12,
    collideRadiusRatio: 1.5,
    collideRadiusThreshold: 10,
    collideRadiusMultiplier: 1.5,
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
    this.resetSimulationAlphaDebounced = debounce(
      this.resetSimulationAlpha,
      350,
      { leading: true, trailing: false },
    )
    this.highlightLink = this.highlightLink.bind(this)
    this.clearLinkHighlight = this.clearLinkHighlight.bind(this)
  }

  startOrUpdateSimulation(nodes, links, options) {
    const model = this
    let newNodes = null
    const {
      attraction,
      linkDistance,
      alphaDecay,
      alphaMin,
      centerX,
      centerY,
      viewport,
    } = options
    // If the simulation is already running, merge new nodes in instead of
    // replacing them.
    if (model.simulation) {
      newNodes = this.updateSimulation(nodes, links, options)
    } else newNodes = nodes
    // Leave alpha unchanged if the simulation is already running - there is a
    // `resetSimulationAlpha` function for explicit resets.
    const alpha = model.simulation ? model.simulation.alpha() : options.alpha
    model.simulation = (model.simulation || d3.forceSimulation()).nodes(
      newNodes,
    )
    model.forceLink = (model.forceLink || d3.forceLink())
      .id(d => AmtProductModel.idForNode(d))
      .distance(linkDistance)
      .links(cloneDeep(links))
    model.forceManyBody = (model.forceManyBody || d3.forceManyBody()).strength(
      attraction,
    )
    model.forceCollide = (model.forceCollide || d3.forceCollide()).radius(d =>
      this.calculateCollideRadius(newNodes, d, options),
    )
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
      .alphaMin(alphaMin)
      .restart()
  }

  updateSimulation(nodes, links, { centerX, centerY, viewport }) {
    const model = this
    let oldNodes = model.simulation.nodes()
    // Remove focus and fixing from any existing nodes.
    oldNodes = oldNodes.map(node =>
      omit(node, 'focused', 'fx', 'fy', 'vx', 'vy'),
    )
    // Remove any positioning information from the incoming nodes.
    nodes = nodes.map(node => omit(node, 'x', 'y', 'vx', 'vy'))
    // Merge new nodes with old nodes.
    let newNodes = [oldNodes, nodes].reduce(mergeConcepts)
    // Remove any nodes that are not present in the new set of nodes.
    newNodes = newNodes.filter(node =>
      nodes
        .map(n => AmtProductModel.idForNode(n))
        .includes(AmtProductModel.idForNode(node)),
    )
    // Remove any nodes that are no longer the subject of a link (except the
    // focused node).
    newNodes = newNodes.filter(
      node =>
        node.focused ||
        links
          .reduce((acc, link) => acc.concat([link.source, link.target]), [])
          .includes(AmtProductModel.idForNode(node)),
    )
    // Fix the position of the focused node, but only if there are more than two
    // nodes.
    return newNodes.length > 2
      ? newNodes.map(node => {
          if (node.focused) {
            node.fx = node.x = centerX || viewport.width / 2
            node.fy = node.y = centerY || viewport.height / 2
          }
          return node
        })
      : newNodes
  }

  stopSimulation() {
    if (this.simulation) this.simulation.stop()
  }

  moveSimulationCenter(deltaX, deltaY, newX, newY, options) {
    const model = this
    if (!model.simulation) return
    const forceCenter = model.simulation.force('center')
    const nodes = model.simulation.nodes().map(node => ({
      ...node,
      x: node.x + deltaX,
      y: node.y + deltaY,
      fx: node.fx ? node.fx + deltaX : null,
      fy: node.fy ? node.fy + deltaY : null,
    }))
    const { relationships: translatedLinks } = translateToAmt({
      concepts: nodes,
      relationships: options.links,
    })
    const centerX = deltaX !== null ? forceCenter.x() + deltaX : newX
    const centerY = deltaY !== null ? forceCenter.y() + deltaY : newY
    this.startOrUpdateSimulation(nodes, translatedLinks, {
      ...options,
      centerX,
      centerY,
    })
    if (options.skipDebounce) {
      this.resetSimulationAlpha(options.alpha)
    } else {
      this.resetSimulationAlphaDebounced(options.alpha)
    }
  }

  calculateCollideRadius(nodes, node, options) {
    const {
      conceptGroupHeight,
      conceptGroupWidth,
      conceptHeight,
      conceptWidth,
      collideRadiusThreshold,
      collideRadiusRatio,
      collideRadiusMultiplier,
    } = options
    // Sets a different collide radius for concepts and concept groups.
    const conceptRadius = codingToGroupCode(node.coding)
      ? conceptGroupHeight /
        2 /
        Math.cos(Math.atan(conceptGroupHeight / conceptGroupWidth))
      : conceptHeight / 2 / Math.cos(Math.atan(conceptHeight / conceptWidth))
    // Applies the ratio and multiplier options.
    return nodes.length > collideRadiusThreshold
      ? conceptRadius * collideRadiusRatio +
          collideRadiusMultiplier * (nodes.length - collideRadiusThreshold)
      : conceptRadius * collideRadiusRatio
  }

  resetSimulationAlpha(alpha) {
    this.simulation.alpha(alpha).restart()
  }

  highlightLink(i) {
    const { links } = this.state,
      oldLink = links[i]
    const newLink = { ...oldLink, ...{ highlight: true } }
    links[i] = newLink
    this.setState({ links })
  }

  clearLinkHighlight(i, event) {
    // Don't clear the highlight if the mouse is exiting on to a link, or a link
    // type label.
    if (
      event &&
      event.relatedTarget &&
      (event.relatedTarget.className === 'link-type' ||
        event.relatedTarget.className === 'link-hover-target')
    )
      return
    const { links } = this.state,
      oldLink = links[i],
      newLink = omit(oldLink, 'highlight')
    links[i] = newLink
    this.setState({ links })
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
        this.moveSimulationCenter(
          clientX - lastDragX,
          clientY - lastDragY,
          null,
          null,
          this.props,
        )
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
    this.moveSimulationCenter(
      event.deltaX * -1,
      event.deltaY * -1,
      null,
      null,
      this.props,
    )
    event.preventDefault()
  }

  handleDoubleClick() {
    this.moveSimulationCenter(
      null,
      null,
      this.props.viewport.width / 2,
      this.props.viewport.height / 2,
      // Reset the simulation immediately, without debouncing.
      { ...this.props, skipDebounce: true },
    )
  }

  componentDidMount() {
    const { nodes, links } = this.props
    if (nodes && links) {
      const { relationships: translatedLinks } = translateToAmt({
        concepts: nodes,
        relationships: links,
      })
      this.startOrUpdateSimulation(nodes, translatedLinks, this.props)
    }
  }

  componentWillUnmount() {
    this.stopSimulation()
  }

  shouldComponentUpdate(nextProps) {
    const { nodes, links } = nextProps
    if (!(nodes && links)) return false
    return true
  }

  componentWillReceiveProps(nextProps) {
    if (!(nextProps.nodes && nextProps.links)) return
    const simulationProps = [
      'nodes',
      'links',
      'attraction',
      'linkDistance',
      'alpha',
      'alphaDecay',
      'alphaMin',
      'conceptWidth',
      'conceptHeight',
      'conceptGroupWidth',
      'conceptGroupHeight',
      'collideRadiusRatio',
      'collideRadiusThreshold',
      'collideRadiusMultiplier',
    ]
    // Only update simulation if simulation-related props are changed.
    if (
      !isEqual(
        pick(this.props, simulationProps),
        pick(nextProps, simulationProps),
      )
    ) {
      const { concepts: nodes, relationships: links } = translateToAmt({
        concepts: nextProps.nodes,
        relationships: nextProps.links,
      })
      this.startOrUpdateSimulation(nodes, links, nextProps)
      this.resetSimulationAlpha(nextProps.alpha)
    }
    if (!isEqual(this.props.viewport, nextProps.viewport)) {
      const { viewport: { width, height } } = nextProps
      this.moveSimulationCenter(null, null, width / 2, height / 2, nextProps)
    }
  }

  render() {
    const { viewport } = this.props
    let concepts, relationships, markers, linkTypes
    try {
      concepts = this.renderConcepts()
      relationships = this.renderRelationships()
      markers = this.renderMarkers()
      linkTypes = this.renderLinkTypes()
    } catch (error) {
      this.stopSimulation()
      throw error
    }
    return (
      <div
        className="product-model"
        style={{ width: viewport.width, height: viewport.height }}
        onWheel={this.handleWheel}
      >
        <div className="product-model-inner">
          <svg
            className="canvas"
            height={viewport.height}
            width={viewport.width}
            preserveAspectRatio="none"
            onMouseMove={this.handleMouseMove}
            onMouseUp={this.handleMouseUp}
            onDoubleClick={this.handleDoubleClick}
          >
            {markers}
            {relationships}
          </svg>
          {concepts}
          {linkTypes}
        </div>
      </div>
    )
  }

  renderConcepts() {
    const {
        conceptWidth,
        conceptHeight,
        conceptGroupWidth,
        conceptGroupHeight,
      } = this.props,
      { nodes } = this.state
    return nodes
      ? nodes.map((node, i) => {
          if (node.type === 'group') {
            return (
              <ConceptGroup
                key={i}
                concepts={node.concepts.map(c => ({
                  ...c,
                  type: amtConceptTypeFor(c.type),
                }))}
                total={node.total}
                linkPath={searchPathFromQuery(node.query)}
                top={node.y - conceptGroupHeight / 2}
                left={node.x - conceptGroupWidth / 2}
                width={conceptWidth}
                height={conceptHeight}
              />
            )
          } else {
            return (
              <Concept
                key={i}
                coding={node.coding}
                type={amtConceptTypeFor(node.type)}
                focused={node.focused}
                top={node.y - conceptHeight / 2}
                left={node.x - conceptWidth / 2}
                width={conceptWidth}
                height={conceptHeight}
              />
            )
          }
        })
      : []
  }

  renderRelationships() {
    const { links } = this.state
    return links
      ? links.map((link, i) => {
          const options = {
            ...this.props,
            mouseMoveLink: () => this.highlightLink(i),
            mouseLeaveLink: event => this.clearLinkHighlight(i, event),
          }
          return curveForLink(link, i, options)
        })
      : []
  }

  renderMarkers() {
    const { arrowSize } = this.props
    return (
      <defs>
        {associationMarker(arrowSize)}
        {inheritanceMarker(arrowSize)}
        {aggregationMarker(arrowSize)}
        {associationMarker(arrowSize, true)}
        {inheritanceMarker(arrowSize, true)}
        {aggregationMarker(arrowSize, true)}
      </defs>
    )
  }

  renderLinkTypes() {
    const { links } = this.state
    if (!links) return null
    return (
      <div className="link-types">
        {links.map((link, i) => {
          const linkLabelPos = {
            x: link.source.x + (link.target.x - link.source.x) / 2,
            y: link.source.y + (link.target.y - link.source.y) / 2,
          }
          return link.highlight ? (
            <div
              className="link-type"
              style={{
                top: `${linkLabelPos.y}px`,
                left: `${linkLabelPos.x}px`,
              }}
              key={i}
              onMouseMove={() => this.highlightLink(i)}
              onMouseLeave={event => this.clearLinkHighlight(i, event)}
            >
              {link.sourceIsGroup
                ? humaniseRelationshipType(link.type, true)
                : humaniseRelationshipType(link.type)}
            </div>
          ) : null
        })}
      </div>
    )
  }

  static idForNode(node) {
    return node.type === 'group'
      ? `group-${codingToGroupCode(node.coding)}`
      : codingToSnomedCode(node.coding)
  }
}

export default AmtProductModel
