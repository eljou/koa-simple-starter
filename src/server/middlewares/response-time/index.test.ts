import sinon from 'sinon'
import { createMockContext } from '@shopify/jest-koa-mocks'
import logger from '@src/utils/logger'
import responseTimeMiddleware from './index'

const sandbox = sinon.createSandbox()

describe('ResponseTime Middeware', (): void => {
  let clock: sinon.SinonFakeTimers

  beforeAll(
    (): void => {
      logger.mute()
      clock = sinon.useFakeTimers()
    },
  )

  afterEach(
    (): void => {
      sandbox.restore()
    },
  )

  afterAll(
    (): void => {
      logger.unmute()
      clock.restore()
    },
  )

  it('should set x-response-time header on response after call', async (done): Promise<void> => {
    const timeout = 10
    const mockedContext = createMockContext()

    await responseTimeMiddleware(
      mockedContext,
      sandbox.stub().callsFake(
        (): void => {
          clock.tick(timeout)
        },
      ),
    )
    expect(mockedContext.response.header).toHaveProperty('x-response-time')
    expect(mockedContext.response.header['x-response-time']).toEqual(`${timeout}ms`)
    done()
  })
})
