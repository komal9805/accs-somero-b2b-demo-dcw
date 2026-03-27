import { initializers } from '@dropins/tools/initializer.js';
import { initialize, setEndpoint } from '@dropins/storefront-pdp/api.js';
import { initializeDropin } from './index.js';
import { CS_FETCH_GRAPHQL, fetchPlaceholders } from '../commerce.js';

/**
 * PDP drop-in init for Quick Order (and similar) pages that render ProductPrice /
 * ProductOptions per line item without a page-level product SKU.
 *
 * Do not import scripts/initializers/pdp.js here: that initializer loads a product
 * from the URL and replaces the document with a 404 when no SKU exists.
 */
await initializeDropin(async () => {
  setEndpoint(CS_FETCH_GRAPHQL);

  const labels = await fetchPlaceholders('placeholders/pdp.json');

  const langDefinitions = {
    default: {
      ...labels,
    },
  };

  return initializers.mountImmediately(initialize, {
    langDefinitions,
    acdl: false,
    persistURLParams: false,
  });
})();
