import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import crypto from 'crypto'

import FhirMedication from '../src/FhirMedication.js'
import * as util from '../src/util.js'

import resource1 from './fixtures/mpuu-23628011000036109.json'
import resource1ChildBundle1 from './fixtures/childBundle-mpuu-23628011000036109.json'
import resource1ChildBundle2 from './fixtures/childBundle-tpuu-23628011000036109.json'
import resource1PackageBundle from './fixtures/packageBundle-mpp-23628011000036109.json'

import resource2 from './fixtures/substance-2292011000036106.json'
import resource2IngredientBundle1 from './fixtures/ingredientBundle-mp-2292011000036106.json'
import resource2IngredientBundle2 from './fixtures/ingredientBundle-mpuu-2292011000036106.json'
import resource2IngredientBundle3 from './fixtures/ingredientBundle-tpuu-2292011000036106.json'

import resource3 from './fixtures/mp-21360011000036101.json'

import resource4 from './fixtures/tpuu-6052011000036107.json'

describe('FhirMedication', () => {
  beforeEach(() => {
    // Replace the browser-dependent `sha256` function with a Node-compatible implementation.
    sinon.stub(util, 'sha256').callsFake(str => {
      const hash = crypto.createHash('sha256')
      hash.update(str)
      return Promise.resolve(hash.digest('hex'))
    })
  })

  afterEach(() => util.sha256.restore())

  it('should pass nodes and links through for UPDSF', () => {
    const props = {
      resource: resource1,
      childBundles: {
        UPDSF: resource1ChildBundle1,
        BPSF: resource1ChildBundle2,
      },
      packageBundles: { UPG: resource1PackageBundle },
    }
    const wrapper = shallow(
      <FhirMedication {...props}>
        <div />
      </FhirMedication>,
    )
    // Give the async code a chance to execute, then check that the correct
    // nodes and links have been passed through to the child component.
    return new Promise(resolve => {
      setTimeout(() => {
        wrapper.update()
        const nodes = wrapper.prop('nodes'),
          links = wrapper.prop('links')
        expect(nodes).toMatchSnapshot()
        expect(links).toMatchSnapshot()
        resolve()
      }, 50)
    })
  })

  it('should pass nodes and links through for substance', () => {
    const props = {
      resource: resource2,
      containsIngredientBundles: {
        UPD: resource2IngredientBundle1,
        UPDSF: resource2IngredientBundle2,
        BPSF: resource2IngredientBundle3,
      },
    }
    const wrapper = shallow(
      <FhirMedication {...props}>
        <div />
      </FhirMedication>,
    )
    // Give the async code a chance to execute, then check that the correct
    // nodes and links have been passed through to the child component.
    return new Promise(resolve => {
      setTimeout(() => {
        wrapper.update()
        const nodes = wrapper.prop('nodes'),
          links = wrapper.prop('links')
        expect(nodes).toMatchSnapshot()
        expect(links).toMatchSnapshot()
        resolve()
      }, 50)
    })
  })

  it('should update the primary resource', () => {
    const props = {
      resource: resource1,
    }
    const wrapper = shallow(
      <FhirMedication {...props}>
        <div />
      </FhirMedication>,
    )
    // Update the resource prop.
    wrapper.setProps({ resource: resource2 })
    // Give the async code a chance to execute, then check that the correct
    // nodes and links have been passed through to the child component.
    return new Promise(resolve => {
      setTimeout(() => {
        wrapper.update()
        const nodes = wrapper.prop('nodes')
        expect(nodes).toMatchSnapshot()
        resolve()
      }, 50)
    })
  })

  it('should update child bundles', () => {
    const props = {
      resource: resource1,
      childBundles: {
        UPDSF: resource1ChildBundle1,
      },
    }
    const wrapper = shallow(
      <FhirMedication {...props}>
        <div />
      </FhirMedication>,
    )
    wrapper.update()
    return new Promise(resolve => {
      setTimeout(() => {
        // Give the mounted state a chance to resolve itself, then push through
        // a change to the `childBundles` prop.
        wrapper.setProps({
          childBundles: {
            UPDSF: resource1ChildBundle1,
            BPSF: resource1ChildBundle2,
          },
        })
        setTimeout(() => {
          // Once the change to the prop has finished, check that the right
          // value has flowed through to the `nodes` prop on the child component.
          wrapper.update()
          const nodes = wrapper.prop('nodes')
          expect(nodes).toMatchSnapshot()
          resolve()
        }, 50)
      }, 50)
    })
  })

  it('should request child UPDs for subject UPD', () => {
    const onRequireChildBundle = jest.fn()
    const props = {
      resource: resource3,
      onRequireChildBundle,
    }
    const wrapper = shallow(
      <FhirMedication {...props}>
        <div />
      </FhirMedication>,
    )
    // Give the async code a chance to execute, then check that the callback has
    // been called with the expected arguments.
    return new Promise(resolve => {
      setTimeout(() => {
        wrapper.update()
        expect(onRequireChildBundle).toHaveBeenCalledWith(
          '21360011000036101',
          'UPD',
        )
        resolve()
      }, 50)
    })
  })

  it('should request BPG packages for subject BPSF', () => {
    const onRequirePackageBundle = jest.fn()
    const props = {
      resource: resource4,
      onRequirePackageBundle,
    }
    const wrapper = shallow(
      <FhirMedication {...props}>
        <div />
      </FhirMedication>,
    )
    // Give the async code a chance to execute, then check that the callback has
    // been called with the expected arguments.
    return new Promise(resolve => {
      setTimeout(() => {
        wrapper.update()
        expect(onRequirePackageBundle).toHaveBeenCalledWith(
          '6052011000036107',
          'BPG',
        )
        resolve()
      }, 50)
    })
  })

  it('should request UPDs containing subject substance', () => {
    const onRequireContainsIngredientBundle = jest.fn()
    const props = {
      resource: resource2,
      onRequireContainsIngredientBundle,
    }
    const wrapper = shallow(
      <FhirMedication {...props}>
        <div />
      </FhirMedication>,
    )
    // Give the async code a chance to execute, then check that the callback has
    // been called with the expected arguments.
    return new Promise(resolve => {
      setTimeout(() => {
        wrapper.update()
        expect(onRequireContainsIngredientBundle).toHaveBeenCalledWith(
          '2292011000036106',
          'UPD',
        )
        resolve()
      }, 50)
    })
  })

  it('should notify about load of subject concept', () => {
    const onLoadSubjectConcept = jest.fn()
    const props = {
      resource: resource1,
      onLoadSubjectConcept,
    }
    const wrapper = shallow(
      <FhirMedication {...props}>
        <div />
      </FhirMedication>,
    )
    // Give the async code a chance to execute, then check that the callback has
    // been called with the expected arguments.
    return new Promise(resolve => {
      setTimeout(() => {
        wrapper.update()
        expect(onLoadSubjectConcept).toHaveBeenCalledWith({
          coding: [
            {
              code: '23628011000036109',
              display: 'paracetamol 500 mg tablet',
              system: 'http://snomed.info/sct',
            },
          ],
          sourceCodeSystemUri: 'http://snomed.info/sct',
          sourceCodeSystemVersion:
            'http://snomed.info/sct?version=http%3A%2F%2Fsnomed.info%2Fsct%2F32506021000036107%2Fversion%2F20180228',
          lastModified: '2014-06-30',
          status: 'active',
          type: 'UPDSF',
        })
        resolve()
      }, 50)
    })
  })

  it('should not request package bundles twice when updated with child bundles', () => {
    const onRequirePackageBundle = jest.fn()
    const props = {
      resource: resource1,
      childBundles: {
        UPDSF: resource1ChildBundle1,
      },
      onRequirePackageBundle,
    }
    const wrapper = shallow(
      <FhirMedication {...props}>
        <div />
      </FhirMedication>,
    )
    wrapper.update()
    return new Promise(resolve => {
      setTimeout(() => {
        // Check that the `onRequirePackageBundle` callback has been called
        // once, at this point.
        expect(onRequirePackageBundle).toHaveBeenCalledTimes(1)
        onRequirePackageBundle.mockClear()
        // Give the mounted state a chance to resolve itself, then push through
        // a change to the `childBundles` prop.
        wrapper.setProps({
          childBundles: {
            UPDSF: resource1ChildBundle1,
            BPSF: resource1ChildBundle2,
          },
        })
        setTimeout(() => {
          // Once the change to the prop has finished, check that the
          // `onRequirePackageBundle` callback has not been called again.
          wrapper.update()
          expect(onRequirePackageBundle).not.toHaveBeenCalled()
          resolve()
        }, 50)
      }, 50)
    })
  })
})
