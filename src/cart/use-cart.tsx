import type { HookFetcher } from '.././commerce/utils/types'
import type { SwrOptions } from '.././commerce/utils/use-data'
import useCommerceCart, { CartInput } from '.././commerce/cart/use-cart'
import type { Cart } from '../api/cart'

const defaultOpts = {
  url: '/api/bigcommerce/cart',
  method: 'GET',
}

export type { Cart }

export const fetcher: HookFetcher<Cart | null, CartInput> = (
  options,
  { cartId },
  fetch
) => {
  return cartId ? fetch({ ...defaultOpts, ...options }) : null
}

/*
Here’s the full list of what constitutes an API:

Method signature: name, parameters, returning value. Ex. swrOptions.
Preconditions: a list of requirements the clients should meet before they can use the method. Ex. cart id in cookies.
Postconditions: a list of guarantees the module makes. Ex. isEmpty
Invariants: a list of conditions that have to be held true at all times. Ex. cart id is always sent to the server.
*/

export function extendHook(
  // Существует множество реализаций зависимости, и класс на этом уровне не может решать, какой из них выбрать.
  // extendHook has a dependency customFetcher. Default implementation is a local default, defined in the same module.
  customFetcher: typeof fetcher,
  swrOptions?: SwrOptions<Cart | null, CartInput>
) {
  const useCart = () => {
    const response = useCommerceCart(defaultOpts, [], customFetcher, {
      revalidateOnFocus: false,
      ...swrOptions,
    })

    // Uses a getter to only calculate the prop when required
    // response.data is also a getter and it's better to not trigger it early
    Object.defineProperty(response, 'isEmpty', {
      get() {
        return Object.values(response.data?.line_items ?? {}).every(
          (items) => !items.length
        )
      },
      set: (x) => x,
    })

    return response
  }

  useCart.extend = extendHook

  return useCart
}

export default extendHook(fetcher)
