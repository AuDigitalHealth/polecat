import React, { Component } from 'react'
import PropTypes from 'prop-types'
import http from 'axios'

import FhirMedication from './FhirMedication.js'
import Error from './Error.js'
import { sniffFormat } from './fhir/restApi'
import { opOutcomeFromJsonResponse } from './fhir/core.js'

class RemoteFhirMedication extends Component {
  static propTypes = {
    path: PropTypes.string.isRequired,
    query: PropTypes.string.isRequired,
    fhirServer: PropTypes.string.isRequired,
  }

  constructor(props) {
    super(props)
    this.state = {}
  }

  updateResource(props) {
    return this.getResource(props)
      .then(resource => this.setState({ resource }))
      .catch(error => this.handleError(error))
  }

  async getResource(props) {
    try {
      const { fhirServer, path, query } = props
      const response = await http.get(fhirServer + path + query, {
        headers: { Accept: 'application/fhir+json, application/json' },
      })
      sniffFormat(response.headers['content-type'])
      return response.data
    } catch (error) {
      if (error.response) this.handleUnsuccessfulResponse(error.response)
      else throw error
    }
  }

  handleUnsuccessfulResponse(response) {
    sniffFormat(response.headers['content-type'])
    const opOutcome = opOutcomeFromJsonResponse(response)
    if (opOutcome) throw opOutcome
    if (response.status === 404) {
      throw new Error(
        `The resource you requested was not found: "${this.props.path}"`
      )
    } else {
      throw new Error(response.statusText || response.status)
    }
  }

  handleLoad(metadata) {
    if (this.props.onLoad) {
      this.props.onLoad(metadata)
    }
  }

  handleError(error) {
    if (this.props.onError) {
      this.props.onError(error)
    } else {
      this.setState(
        () => ({ error, status: 'error' }),
        () => {
          throw error
        }
      )
    }
  }

  componentWillMount() {
    console.log('RemoteFhirMedication componentWillMount', {
      'this.props': this.props,
    })
    this.updateResource(this.props)
  }

  componentWillReceiveProps(nextProps) {
    console.log('RemoteFhirMedication componentWillReceiveProps', {
      'this.props': this.props,
      nextProps,
    })
    this.updateResource(nextProps)
  }

  componentDidUpdate(nextProps, nextState) {
    console.log('RemoteFhirMedication componentDidUpdate', {
      nextProps,
      nextState,
    })
  }

  render() {
    const { resource } = this.state

    return (
      <div className='remote-fhir-medication'>
        <FhirMedication
          resource={resource}
          onLoad={this.handleLoad}
          onError={this.handleError}
        />
      </div>
    )
  }
}

export default RemoteFhirMedication
