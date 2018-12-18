import { hooks } from '@bigcommerce/stencil-utils';
import CatalogPage from './catalog';
import $ from 'jquery';
import FacetedSearch from './common/faceted-search';
import './custom-category';
export default class Category extends CatalogPage {
    loaded() {
        if ($('#facetedSearch').length > 0) {
            this.initFacetedSearch();
        } else {
            this.onSortBySubmit = this.onSortBySubmit.bind(this);
            hooks.on('sortBy-submitted', this.onSortBySubmit);
        }
    }
    getAllProducts() {
        const paginations = this.context.paginationCategory || [];
        if (paginations) {
            for (let i = 1; i < paginations.length; i++) {
                const formatUrl = paginations[i].url;
                const productsPerPage = this.context.categoryProductsPerPage;
                const requestOptions = {
                    config: {
                        category: {
                            shop_by_price: true,
                            products: {
                                limit: productsPerPage,
                            },
                        },
                    },
                    template: 'b2b/catalog-product-listing'
                };
                api.getPage(formatUrl, requestOptions, (err, content) => {
                    const $listing = $(content);
                    if (err) {
                        throw new Error(err);
                    }
                    // Refresh view with new content
                    console.log($listing);
                });
            }
        }
    }
    initFacetedSearch() {
        const $productListingContainer = $('#product-listing-container');
        const $facetedSearchContainer = $('#faceted-search-container');
        const productsPerPage = this.context.categoryProductsPerPage;
        const requestOptions = {
            config: {
                category: {
                    shop_by_price: true,
                    products: {
                        limit: productsPerPage,
                    },
                },
            },
            template: {
                productListing: 'category/product-listing',
                sidebar: 'category/sidebar',
            },
            showMore: 'category/show-more',
        };

        this.facetedSearch = new FacetedSearch(requestOptions, (content) => {
            $productListingContainer.html(content.productListing);
            $facetedSearchContainer.html(content.sidebar);

            $('html, body').animate({
                scrollTop: 0,
            }, 100);
        });
    }
}
