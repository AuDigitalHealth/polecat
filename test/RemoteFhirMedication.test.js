import React from 'react'
import { shallow } from 'enzyme'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

import { RemoteFhirMedication } from '../src/RemoteFhirMedication.js'
import FhirMedication from '../src/FhirMedication.js'
import { fhirMedicationTypeFor } from '../src/fhir/medication.js'
import config from './config.js'

import ctpp1 from './fixtures/ctpp-1065531000168104.json'
import ctpp2 from './fixtures/ctpp-19255011000036102.json'
import substance1 from './fixtures/substance-2292011000036106.json'
import childBundle from './fixtures/childBundle-21360011000036101.json'
import packageBundle from './fixtures/packageBundle-53975011000036108.json'
import containsIngredientBundle from './fixtures/ingredientBundle-1975011000036109.json'
import operationOutcome from './fixtures/operationOutcome.json'

const mock = new MockAdapter(axios)

describe('RemoteFhirMedication', () => {
  afterEach(() => mock.reset())

  it('should pass children on to FhirMedication', () => {
    const props = {
      fhirServer: config.fhirServer,
      id: '1065531000168104',
    }
    const wrapper = shallow(
      <RemoteFhirMedication {...props}>
        <div id="someChild" />
      </RemoteFhirMedication>,
    )
    // Find the child element inside the FhirMedication component.
    const child = wrapper.find(FhirMedication).find('#someChild')
    expect(child).toBeDefined()
  })

  describe('mount', () => {
    it('should provide Medication resource to FhirMedication', () => {
      const props = {
        fhirServer: config.fhirServer,
        id: '1065531000168104',
        // `resourceType` should default to "Medication".
      }
      mock
        // Stub out the HTTP request to retrieve the subject resource.
        .onGet(`${props.fhirServer}/Medication/${props.id}`)
        .replyOnce(200, ctpp1, { 'content-type': 'application/fhir+json' })
      const wrapper = shallow(
        <RemoteFhirMedication {...props}>
          <div />
        </RemoteFhirMedication>,
      )
      // Give the async code a chance to execute, then check that the subject
      // resource has been passed through to the `resource` prop of the
      // FhirMedication component.
      return new Promise(resolve => {
        setTimeout(() => {
          wrapper.update()
          const fhirMedication = wrapper.find(FhirMedication)
          expect(fhirMedication).toBeDefined()
          expect(fhirMedication.prop('resource')).toBeDefined()
          expect(fhirMedication.prop('resource')).toEqual(ctpp1)
          resolve()
        }, 50)
      })
    })

    it('should provide Substance resource to FhirMedication', () => {
      const props = {
        fhirServer: config.fhirServer,
        id: '2292011000036106',
        resourceType: 'Substance',
      }
      mock
        // Stub out the HTTP request to retrieve the subject resource.
        .onGet(`${props.fhirServer}/Substance/${props.id}`)
        .replyOnce(200, substance1, { 'content-type': 'application/fhir+json' })
      const wrapper = shallow(
        <RemoteFhirMedication {...props}>
          <div />
        </RemoteFhirMedication>,
      )
      // Give the async code a chance to execute, then check that the subject
      // resource has been passed through to the `resource` prop of the
      // FhirMedication component.
      return new Promise(resolve => {
        setTimeout(() => {
          wrapper.update()
          const fhirMedication = wrapper.find(FhirMedication)
          expect(fhirMedication).toBeDefined()
          expect(fhirMedication.prop('resource')).toBeDefined()
          expect(fhirMedication.prop('resource')).toEqual(substance1)
          resolve()
        }, 50)
      })
    })
  })

  describe('on prop update', () => {
    it('should provide Medication resource to FhirMedication', () => {
      const props = {
        fhirServer: config.fhirServer,
        id: '1065531000168104',
      }
      const nextProps = { id: '19255011000036102' }
      mock
        // Stub out the HTTP request to retrieve the subject resource.
        .onGet(`${props.fhirServer}/Medication/${props.id}`)
        .replyOnce(200, ctpp1, { 'content-type': 'application/fhir+json' })
        // Stub out a subsequent HTTP request, triggered when the props are
        // updated to point to a new Medication ID.
        .onGet(`${props.fhirServer}/Medication/${nextProps.id}`)
        .replyOnce(200, ctpp2, { 'content-type': 'application/fhir+json' })
      const wrapper = shallow(
        <RemoteFhirMedication {...props}>
          <div />
        </RemoteFhirMedication>,
      )
      // Update props to a different ID.
      wrapper.setProps(nextProps)
      // Give the async code a chance to execute, then check that the second
      // resource has been passed through to the `resource` prop of the
      // FhirMedication component.
      return new Promise(resolve => {
        setTimeout(() => {
          wrapper.update()
          const fhirMedication = wrapper.find(FhirMedication)
          expect(fhirMedication).toBeDefined()
          expect(fhirMedication.prop('resource')).toBeDefined()
          expect(fhirMedication.prop('resource')).toEqual(ctpp2)
          resolve()
        }, 50)
      })
    })
  })

  describe('onRequireRelatedResources', () => {
    it('should pass related resources to FhirMedication', () => {
      const props = {
        fhirServer: config.fhirServer,
        id: '1065531000168104',
      }
      const relatedId = '19255011000036102'
      mock
        // Stub out the HTTP request to retrieve the subject resource.
        .onGet(`${props.fhirServer}/Medication/${props.id}`)
        .replyOnce(200, ctpp1, { 'content-type': 'application/fhir+json' })
        // Stub out the HTTP request to retrieve the related resource.
        .onGet(`${props.fhirServer}/Medication/${relatedId}`)
        .replyOnce(200, ctpp2, { 'content-type': 'application/fhir+json' })
      const wrapper = shallow(
        <RemoteFhirMedication {...props}>
          <div />
        </RemoteFhirMedication>,
      )
      // Get the `onRequireRelatedResources` callback passed to the
      // FhirMedication component.
      const callback = wrapper
        .find(FhirMedication)
        .prop('onRequireRelatedResources')
      // Call the callback with an array containing the ID of the related resource.
      callback([relatedId])
      // Give the async code a chance to execute, then check that the expected
      // resource has been passed through to the `relatedResources` prop of the
      // FhirMedication component.
      return new Promise(resolve => {
        setTimeout(() => {
          wrapper.update()
          const fhirMedication = wrapper.find(FhirMedication)
          expect(fhirMedication).toBeDefined()
          expect(fhirMedication.prop('relatedResources')).toBeDefined()
          expect(fhirMedication.prop('relatedResources')).toEqual({
            // The expected prop value is an object keyed on ID, with the
            // resource itself as the value.
            [relatedId]: ctpp2,
          })
          resolve()
        }, 50)
      })
    })
  })

  describe('onRequireChildBundle', () => {
    it('should pass bundle to FhirMedication', () => {
      const props = {
        fhirServer: config.fhirServer,
        id: '1065531000168104',
      }
      const parentId = '19255011000036102',
        resourceType = 'MP'
      mock
        // Stub out the HTTP request to retrieve the subject resource.
        .onGet(`${props.fhirServer}/Medication/${props.id}`)
        .replyOnce(200, ctpp1, { 'content-type': 'application/fhir+json' })
        // Stub out the HTTP request to search for child resources.
        .onGet(
          `${
            props.fhirServer
          }/Medication?ancestor=Medication/${parentId}&medication-resource-type=UPD`,
        )
        .replyOnce(200, childBundle, {
          'content-type': 'application/fhir+json',
        })
      const wrapper = shallow(
        <RemoteFhirMedication {...props}>
          <div />
        </RemoteFhirMedication>,
      )
      // Get the `onRequireChildBundle` callback passed to the
      // FhirMedication component.
      const callback = wrapper.find(FhirMedication).prop('onRequireChildBundle')
      // Call the callback with the parent ID, and the FHIR medication type for
      // the type of child resource to be queried.
      callback(parentId, fhirMedicationTypeFor(resourceType))
      // Give the async code a chance to execute, then check that the expected
      // bundle has been passed through to the `childBundles` prop of the
      // FhirMedication component.
      return new Promise(resolve => {
        setTimeout(() => {
          wrapper.update()
          const fhirMedication = wrapper.find(FhirMedication)
          expect(fhirMedication).toBeDefined()
          expect(fhirMedication.prop('childBundles')).toBeDefined()
          expect(fhirMedication.prop('childBundles')).toEqual({
            // The expected prop value is an object keyed on FHIR medication
            // type, with the bundle as the value.
            UPD: childBundle,
          })
          resolve()
        }, 50)
      })
    })
  })

  describe('onRequirePackageBundle', () => {
    it('should pass bundle to FhirMedication', () => {
      const props = {
        fhirServer: config.fhirServer,
        id: '1065531000168104',
      }
      const subjectId = '19255011000036102',
        resourceType = 'TPP'
      mock
        // Stub out the HTTP request to retrieve the subject resource.
        .onGet(`${props.fhirServer}/Medication/${props.id}`)
        .replyOnce(200, ctpp1, { 'content-type': 'application/fhir+json' })
        // Stub out the HTTP request to search for packages.
        .onGet(
          `${
            props.fhirServer
          }/Medication?package-item=Medication/${subjectId}&medication-resource-type=BPG`,
        )
        .replyOnce(200, packageBundle, {
          'content-type': 'application/fhir+json',
        })
      const wrapper = shallow(
        <RemoteFhirMedication {...props}>
          <div />
        </RemoteFhirMedication>,
      )
      // Get the `onRequirePackageBundle` callback passed to the
      // FhirMedication component.
      const callback = wrapper
        .find(FhirMedication)
        .prop('onRequirePackageBundle')
      // Call the callback with the subject ID, and the FHIR medication type for
      // the type of package resource to be queried.
      callback(subjectId, fhirMedicationTypeFor(resourceType))
      // Give the async code a chance to execute, then check that the expected
      // bundle has been passed through to the `packageBundles` prop of the
      // FhirMedication component.
      return new Promise(resolve => {
        setTimeout(() => {
          wrapper.update()
          const fhirMedication = wrapper.find(FhirMedication)
          expect(fhirMedication).toBeDefined()
          expect(fhirMedication.prop('packageBundles')).toBeDefined()
          expect(fhirMedication.prop('packageBundles')).toEqual({
            // The expected prop value is an object keyed on FHIR medication
            // type, with the bundle as the value.
            BPG: packageBundle,
          })
          resolve()
        }, 50)
      })
    })
  })

  describe('onRequireContainsIngredientBundle', () => {
    it('should pass bundle to FhirMedication', () => {
      const props = {
        fhirServer: config.fhirServer,
        id: '2292011000036106',
      }
      const substanceId = '2292011000036106',
        resourceType = 'TPUU'
      mock
        // Stub out the HTTP request to retrieve the subject resource.
        .onGet(`${props.fhirServer}/Medication/${props.id}`)
        .replyOnce(200, substance1, {
          'content-type': 'application/fhir+json',
        })
        // Stub out the HTTP request to search for resources containing the ingredient.
        .onGet(
          `${
            props.fhirServer
          }/Medication?ingredient=Substance/${substanceId}&medication-resource-type=BPSF`,
        )
        .replyOnce(200, containsIngredientBundle, {
          'content-type': 'application/fhir+json',
        })
      const wrapper = shallow(
        <RemoteFhirMedication {...props}>
          <div />
        </RemoteFhirMedication>,
      )
      // Get the `onRequireContainsIngredientBundle` callback passed to the
      // FhirMedication component.
      const callback = wrapper
        .find(FhirMedication)
        .prop('onRequireContainsIngredientBundle')
      // Call the callback with the substance ID, and the FHIR medication type for
      // the type of resource to be queried.
      callback(substanceId, fhirMedicationTypeFor(resourceType))
      // Give the async code a chance to execute, then check that the expected
      // bundle has been passed through to the `containsIngredientBundles` prop of the
      // FhirMedication component.
      return new Promise(resolve => {
        setTimeout(() => {
          wrapper.update()
          const fhirMedication = wrapper.find(FhirMedication)
          expect(fhirMedication).toBeDefined()
          expect(fhirMedication.prop('containsIngredientBundles')).toBeDefined()
          expect(fhirMedication.prop('containsIngredientBundles')).toEqual({
            // The expected prop value is an object keyed on FHIR medication
            // type, with the bundle as the value.
            BPSF: containsIngredientBundle,
          })
          resolve()
        }, 50)
      })
    })
  })

  describe('onLoadSubjectConcept', () => {
    it('should call the upstream callback', () => {
      const upstreamCallback = jest.fn()
      const props = {
        fhirServer: config.fhirServer,
        id: '2292011000036106',
        onLoadSubjectConcept: upstreamCallback,
      }
      const subjectConcept = {
        type: 'BPG',
        coding: [
          {
            system: 'http://snomed.info/sct',
            code: '813241000168107',
            display: 'Nuromol film-coated tablet, 24',
          },
        ],
        status: 'active',
        sourceCodeSystemUri: 'http://snomed.info/sct',
        sourceCodeSystemVersion:
          'http://snomed.info/sct?version=http%3A%2F%2Fsnomed.info%2Fsct%2F32506021000036107%2Fversion%2F20180131',
        focused: true,
      }
      // Mock all HTTP requests.
      mock.onAny()
      const wrapper = shallow(
        <RemoteFhirMedication {...props}>
          <div />
        </RemoteFhirMedication>,
      )
      // Get the `onLoadSubjectConcecpt` callback passed to the FhirMedication component.
      const callback = wrapper.find(FhirMedication).prop('onLoadSubjectConcept')
      // Call the callback with the subject concept.
      callback(subjectConcept)
      // Check that the upstream callback we passed in the props of
      // RemoteFhirMedication was called with the same concept.
      expect(upstreamCallback).toBeCalledWith(subjectConcept)
    })
  })

  describe('loading', () => {
    it('should call the onLoadingChange callback on success', () => {
      const onLoadingChange = jest.fn()
      const props = {
        fhirServer: config.fhirServer,
        id: '1065531000168104',
        onLoadingChange,
      }
      mock
        // Stub out the HTTP request to retrieve the subject resource.
        .onGet(`${props.fhirServer}/Medication/${props.id}`)
        .replyOnce(200, ctpp1, { 'content-type': 'application/fhir+json' })
      shallow(
        <RemoteFhirMedication {...props}>
          <div />
        </RemoteFhirMedication>,
      )
      // Give the async code a chance to execute, then check that
      // `onLoadingChange` has been called twice - with true on the first call
      // and false on the second.
      return new Promise(resolve => {
        setTimeout(() => {
          expect(onLoadingChange.mock.calls).toHaveLength(2)
          expect(onLoadingChange.mock.calls[0][0]).toBe(true)
          expect(onLoadingChange.mock.calls[1][0]).toBe(false)
          resolve()
        }, 50)
      })
    })

    it('should call the onLoadingChange callback on error', () => {
      const onLoadingChange = jest.fn()
      const props = {
        fhirServer: config.fhirServer,
        id: '1065531000168104',
        onLoadingChange,
      }
      mock
        // Stub out the HTTP request to retrieve the subject resource.
        .onGet(`${props.fhirServer}/Medication/${props.id}`)
        .replyOnce(500)
      shallow(
        <RemoteFhirMedication {...props}>
          <div />
        </RemoteFhirMedication>,
      )
      // Give the async code a chance to execute, then check that
      // `onLoadingChange` has been called twice - with true on the first call
      // and false on the second.
      return new Promise(resolve => {
        setTimeout(() => {
          expect(onLoadingChange.mock.calls).toHaveLength(2)
          expect(onLoadingChange.mock.calls[0][0]).toBe(true)
          expect(onLoadingChange.mock.calls[1][0]).toBe(false)
          resolve()
        }, 50)
      })
    })
  })

  describe('error handling', () => {
    it('should call the onError callback on 404', () => {
      const onError = jest.fn()
      const props = {
        fhirServer: config.fhirServer,
        id: '1065531000168104',
        onError,
      }
      mock
        // Stub out the HTTP request to retrieve the subject resource with a not
        // found error.
        .onGet(`${props.fhirServer}/Medication/${props.id}`)
        .replyOnce(404)
      shallow(
        <RemoteFhirMedication {...props}>
          <div />
        </RemoteFhirMedication>,
      )
      // Give the async code a chance to execute, then check that the subject
      // resource has been passed through to the `resource` prop of the
      // FhirMedication component.
      return new Promise(resolve => {
        setTimeout(() => {
          expect(onError).toHaveBeenCalled()
          expect(onError.mock.calls[0][0].message).toBeTruthy()
          resolve()
        }, 50)
      })
    })

    it('should call the onError callback on 400 OperationOutcome', () => {
      const onError = jest.fn()
      const props = {
        fhirServer: config.fhirServer,
        id: '1065531000168104',
        onError,
      }
      mock
        // Stub out the HTTP request to retrieve the subject resource with a not
        // found error.
        .onGet(`${props.fhirServer}/Medication/${props.id}`)
        .replyOnce(400, operationOutcome, {
          'content-type': 'application/fhir+json',
        })
      shallow(
        <RemoteFhirMedication {...props}>
          <div />
        </RemoteFhirMedication>,
      )
      // Give the async code a chance to execute, then check that the subject
      // resource has been passed through to the `resource` prop of the
      // FhirMedication component.
      return new Promise(resolve => {
        setTimeout(() => {
          expect(onError).toHaveBeenCalled()
          expect(onError.mock.calls[0][0].issue).toBeTruthy()
          expect(onError.mock.calls[0][0].issue).toMatchSnapshot()
          resolve()
        }, 50)
      })
    })

    it('should call the onError callback on network error', () => {
      const onError = jest.fn()
      const props = {
        fhirServer: config.fhirServer,
        id: '1065531000168104',
        onError,
      }
      mock
        // Stub out the HTTP request to retrieve the subject resource with a not
        // found error.
        .onGet(`${props.fhirServer}/Medication/${props.id}`)
        .networkError()
      shallow(
        <RemoteFhirMedication {...props}>
          <div />
        </RemoteFhirMedication>,
      )
      // Give the async code a chance to execute, then check that the subject
      // resource has been passed through to the `resource` prop of the
      // FhirMedication component.
      return new Promise(resolve => {
        setTimeout(() => {
          expect(onError).toHaveBeenCalled()
          expect(onError.mock.calls[0][0].message).toBeTruthy()
          resolve()
        }, 50)
      })
    })

    it('should call the onError callback on timeout', () => {
      const onError = jest.fn()
      const props = {
        fhirServer: config.fhirServer,
        id: '1065531000168104',
        onError,
      }
      mock
        // Stub out the HTTP request to retrieve the subject resource with a not
        // found error.
        .onGet(`${props.fhirServer}/Medication/${props.id}`)
        .timeout()
      shallow(
        <RemoteFhirMedication {...props}>
          <div />
        </RemoteFhirMedication>,
      )
      // Give the async code a chance to execute, then check that the subject
      // resource has been passed through to the `resource` prop of the
      // FhirMedication component.
      return new Promise(resolve => {
        setTimeout(() => {
          expect(onError).toHaveBeenCalled()
          expect(onError.mock.calls[0][0].message).toBeTruthy()
          resolve()
        }, 50)
      })
    })
  })
})
