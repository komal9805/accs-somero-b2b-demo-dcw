import { render as rlRenderer } from '@dropins/storefront-requisition-list/render.js';
import RequisitionListView
  from '@dropins/storefront-requisition-list/containers/RequisitionListView.js';
import * as pdpApi from '@dropins/storefront-pdp/api.js';

import {
  checkIsAuthenticated,
  CUSTOMER_LOGIN_PATH,
  CUSTOMER_REQUISITION_LISTS_PATH,
  CS_FETCH_GRAPHQL,
  rootLink,
} from '../../scripts/commerce.js';

// Initialize dropins
import '../../scripts/initializers/requisition-list.js';

export default async function decorate(block) {
  // Inherit Fetch GraphQL Instance (Catalog Service) for product enrichment (price/images).
  pdpApi.setEndpoint(CS_FETCH_GRAPHQL);

  const normalizeAmount = (amount) => {
    if (!amount) return amount;
    const valueNum = typeof amount.value === 'number' ? amount.value : Number(amount.value);
    return {
      ...amount,
      value: Number.isFinite(valueNum) ? valueNum : 0,
    };
  };

  const normalizeProductForRequisitionList = (product) => {
    if (!product) return product;

    // Normalize existing `price` values to numbers.
    if (product.price?.final?.amount) {
      return {
        ...product,
        price: {
          ...product.price,
          final: { ...product.price.final, amount: normalizeAmount(product.price.final.amount) },
          regular: product.price.regular?.amount
            ? { ...product.price.regular, amount: normalizeAmount(product.price.regular.amount) }
            : product.price.regular,
        },
      };
    }

    const min = product.priceRange?.minimum;
    if (!min?.final?.amount) return product;

    return {
      ...product,
      price: {
        final: { amount: normalizeAmount(min.final.amount) },
        regular: { amount: normalizeAmount(min.regular?.amount || min.final.amount) },
        roles: min.roles || [],
      },
    };
  };

  if (!checkIsAuthenticated()) {
    window.location.href = rootLink(CUSTOMER_LOGIN_PATH);
  } else {
    let viewRenderFunction = null;

    const renderView = async () => {
      const { searchParams } = new URL(window.location.href);
      const requisitionListUid = searchParams.get('requisitionListUid');

      viewRenderFunction = rlRenderer.render(RequisitionListView, {
        requisitionListUid,
        routeRequisitionListGrid: () => rootLink(`${CUSTOMER_REQUISITION_LISTS_PATH}`),
        getProductData: async (skus) => {
          const products = await pdpApi.getProductsData(skus.map((sku) => ({ sku })), true);
          return products?.map(normalizeProductForRequisitionList) ?? null;
        },
        enrichConfigurableProducts: async (items) => items,
      });

      return viewRenderFunction(block);
    };

    await renderView();
  }
}
